import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getRestaurantBySlug, getMenuItems, createBooking, createOrder, getPromotion, getMenuItemsWithVariants, getExtraToppings, getToppingGroups, getHeroImages, getStripeConfig, createPaymentIntent, getBranchFeatures } from "@/lib/api";
import { useSubdomainSlug } from "@/App";
import { themes } from "@shared/themes";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ALLERGEN_KEYS, type AllergenKey, type AllergenProfile, type MenuItem as MenuItemType, type Restaurant, type Promotion, type MenuItemWithVariants, type MenuItemVariant, type ExtraTopping, type HeroImage, type ToppingGroupWithOptions, getCurrencySymbol } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBasket, MapPin, Clock, ChevronUp, ChevronDown, Loader2, ArrowLeft, Search, Plus, User, ChevronRight, ArrowUp, ChevronLeft, X, Calendar, Minus, AlertTriangle, Check, HelpCircle, Pencil, Truck, ShoppingBag, Phone, Globe, Store, Tag, Banknote, CreditCard, Menu, ShoppingCart, CheckSquare, UtensilsCrossed, Building, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import useSound from "use-sound";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LoginPopup } from "@/components/login-popup";
import { InstallPrompt } from "@/components/install-prompt";
import { useRestaurantPwaBranding } from "@/hooks/use-pwa-branding";
import { OptionGroupSelector, buildOptionGroupSelections, validateOptionGroups as validateOptionGroupsUtil } from "@/components/option-group-selector";

interface OptionGroupSelection {
  groupId: string;
  groupHeadline: string;
  isRequired: boolean;
  selectedOptions: { id: string; name: string; price: number }[];
  halfType?: string | null; // 'left', 'right', 'extra', or null for regular
}

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  removedIngredients: string[];
  extras: string[];
  image: string;
  optionGroups?: OptionGroupSelection[];
}

// Helper function to format option groups with Half & Half pizza support
function formatOptionGroupsForDisplay(
  optionGroups: OptionGroupSelection[] | undefined,
  currencySymbol: string,
  colorClass: string = 'text-orange-400'
): React.ReactNode {
  if (!optionGroups || optionGroups.length === 0) return null;

  // Group by halfType
  const leftHalf = optionGroups.filter(g => g.halfType === 'left');
  const rightHalf = optionGroups.filter(g => g.halfType === 'right');
  const extras = optionGroups.filter(g => g.halfType === 'extra');
  const regular = optionGroups.filter(g => !g.halfType || (g.halfType !== 'left' && g.halfType !== 'right' && g.halfType !== 'extra'));

  const formatOptions = (groups: OptionGroupSelection[], prefix?: string, isBold?: boolean) => {
    const allOptions = groups.flatMap(g => 
      g.selectedOptions.map(o => 
        o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')
      )
    );
    if (allOptions.length === 0) return null;
    const text = prefix ? `${prefix}: ${allOptions.join(', ')}` : allOptions.join(', ');
    return isBold ? <strong>{text}</strong> : text;
  };

  const hasHalfHalf = leftHalf.length > 0 || rightHalf.length > 0;

  return (
    <div className="mt-0.5 space-y-0.5">
      {hasHalfHalf && (
        <>
          {leftHalf.length > 0 && (
            <p className={`text-xs ${colorClass} font-medium`}>
              🍕 Left Half: {leftHalf.flatMap(g => g.selectedOptions.map(o => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : ''))).join(', ')}
            </p>
          )}
          {rightHalf.length > 0 && (
            <p className={`text-xs ${colorClass} font-medium`}>
              🍕 Right Half: {rightHalf.flatMap(g => g.selectedOptions.map(o => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : ''))).join(', ')}
            </p>
          )}
        </>
      )}
      {extras.length > 0 && (
        <p className={`text-xs ${colorClass} font-bold`}>
          ⭐ Extra: {extras.flatMap(g => g.selectedOptions.map(o => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : ''))).join(', ')}
        </p>
      )}
      {regular.map((group, gIdx) => (
        <p key={gIdx} className={`text-xs ${colorClass} font-medium`}>
          + {group.selectedOptions.map(o => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
        </p>
      ))}
    </div>
  );
}

interface CardPaymentFormProps {
  amount: number;
  restaurantId: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  children: React.ReactNode;
  themeStyle?: 'dhaba' | 'emparo' | 'default' | 'shirin' | 'dark';
  validateForm?: () => { isValid: boolean; error?: string };
  validateDeliveryAsync?: () => Promise<{ valid: boolean; error?: string }>;
}

function BankTransferQRSection({ restaurant, total, currencySymbol, onPlaceOrder }: {
  restaurant: any; total: string; currencySymbol: string; onPlaceOrder?: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!restaurant?.bankTransferEnabled) return null;
  const hasBankDetails = restaurant?.bankAccountName && (restaurant?.bankAccountNumber || restaurant?.bankIban);
  const hasEasyPaisa = restaurant?.easypaisaAccountNumber && restaurant?.easypaisaAccountName;
  const hasJazzCash = restaurant?.jazzcashAccountNumber && restaurant?.jazzcashAccountName;
  
  if (!hasBankDetails && !hasEasyPaisa && !hasJazzCash) return null;
  
  const qrParams = new URLSearchParams();
  if (hasBankDetails) {
    if (restaurant.bankName) qrParams.set('bank', restaurant.bankName);
    qrParams.set('name', restaurant.bankAccountName);
    if (restaurant.bankSortCode) qrParams.set('sc', restaurant.bankSortCode);
    if (restaurant.bankAccountNumber) qrParams.set('acc', restaurant.bankAccountNumber);
    if (restaurant.bankIban) qrParams.set('iban', restaurant.bankIban);
  }
  if (hasEasyPaisa) {
    qrParams.set('ep', restaurant.easypaisaAccountNumber);
    qrParams.set('epn', restaurant.easypaisaAccountName);
  }
  if (hasJazzCash) {
    qrParams.set('jc', restaurant.jazzcashAccountNumber);
    qrParams.set('jcn', restaurant.jazzcashAccountName);
  }
  qrParams.set('amount', total);
  qrParams.set('cur', currencySymbol);
  if (restaurant.name) qrParams.set('r', restaurant.name);
  const qrData = `${window.location.origin}/pay-info?${qrParams.toString()}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const DetailRow = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-bold text-white text-sm">{value}</p>
      </div>
      <button
        onClick={() => copyToClipboard(value, copyKey)}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
        data-testid={`button-copy-${copyKey}`}
      >
        {copied === copyKey ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-2xl p-4 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full mb-3">
            <Building className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Direct Bank Transfer</span>
          </div>
          <p className="text-xs text-gray-400">Copy details below to send payment via your banking app</p>
        </div>

        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-xl shadow-lg">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="L"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">Amount: {currencySymbol}{total}</p>
        </div>

        <div className="space-y-1.5">
          {hasBankDetails && (
            <>
              {restaurant.bankName && (
                <DetailRow label="Bank" value={restaurant.bankName} copyKey="bank-name" />
              )}
              <DetailRow label="Account Name" value={restaurant.bankAccountName} copyKey="account-name" />
              {restaurant.bankSortCode && (
                <DetailRow label="Sort Code" value={restaurant.bankSortCode} copyKey="sort-code" />
              )}
              {restaurant.bankAccountNumber && (
                <DetailRow label="Account Number" value={restaurant.bankAccountNumber} copyKey="account-number" />
              )}
              {restaurant.bankIban && (
                <DetailRow label="IBAN" value={restaurant.bankIban} copyKey="iban" />
              )}
            </>
          )}
          {hasEasyPaisa && (
            <>
              <DetailRow label="EasyPaisa Name" value={restaurant.easypaisaAccountName} copyKey="ep-name" />
              <DetailRow label="EasyPaisa Number" value={restaurant.easypaisaAccountNumber} copyKey="ep-number" />
            </>
          )}
          {hasJazzCash && (
            <>
              <DetailRow label="JazzCash Name" value={restaurant.jazzcashAccountName} copyKey="jc-name" />
              <DetailRow label="JazzCash Number" value={restaurant.jazzcashAccountNumber} copyKey="jc-number" />
            </>
          )}
        </div>

        {restaurant.bankTransferVideoUrl && (
          <div className="pt-2 border-t border-white/10">
            <a
              href={restaurant.bankTransferVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors justify-center"
              data-testid="link-bank-transfer-video"
            >
              <Globe className="h-4 w-4" />
              Watch how to transfer
            </a>
          </div>
        )}
      </div>

      {onPlaceOrder && (
        <Button
          onClick={onPlaceOrder}
          className="w-full h-12 text-base font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
          data-testid="button-place-order-bank-transfer"
        >
          <Building className="mr-2 h-5 w-5" />
          I've Sent Payment - Place Order - {currencySymbol}{total}
        </Button>
      )}
    </div>
  );
}

function WalletPaymentButton({ amount, restaurantId, currency, label, onPaymentSuccess, onPaymentError, validateForm, validateDeliveryAsync }: {
  amount: number;
  restaurantId: string;
  currency: string;
  label: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  validateForm?: () => { isValid: boolean; error?: string };
  validateDeliveryAsync?: () => Promise<{ valid: boolean; error?: string }>;
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);

  const validateFormRef = useRef(validateForm);
  const validateDeliveryAsyncRef = useRef(validateDeliveryAsync);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentErrorRef = useRef(onPaymentError);
  const amountRef = useRef(amount);
  const restaurantIdRef = useRef(restaurantId);

  useEffect(() => { validateFormRef.current = validateForm; }, [validateForm]);
  useEffect(() => { validateDeliveryAsyncRef.current = validateDeliveryAsync; }, [validateDeliveryAsync]);
  useEffect(() => { onPaymentSuccessRef.current = onPaymentSuccess; }, [onPaymentSuccess]);
  useEffect(() => { onPaymentErrorRef.current = onPaymentError; }, [onPaymentError]);
  useEffect(() => { amountRef.current = amount; }, [amount]);
  useEffect(() => { restaurantIdRef.current = restaurantId; }, [restaurantId]);

  useEffect(() => {
    if (!stripe || !amount || amount <= 0) return;

    const symbolToCode: Record<string, string> = { '£': 'gbp', '$': 'usd', '€': 'eur', 'Rs': 'pkr', '₹': 'inr', 'د.إ': 'aed', '₺': 'try', '﷼': 'sar' };
    const raw = currency || 'GBP';
    const currencyCode = (symbolToCode[raw] || raw).toLowerCase();
    const amountInSmallestUnit = Math.round(amount * 100);

    const pr = stripe.paymentRequest({
      country: currencyCode === 'gbp' ? 'GB' : currencyCode === 'usd' ? 'US' : currencyCode === 'eur' ? 'DE' : currencyCode === 'pkr' ? 'PK' : currencyCode === 'aed' ? 'AE' : currencyCode === 'try' ? 'TR' : currencyCode === 'inr' ? 'IN' : 'GB',
      currency: currencyCode,
      total: {
        label: label || 'Order Total',
        amount: amountInSmallestUnit,
      },
      requestPayerName: true,
      requestPayerEmail: false,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setWalletAvailable(true);
      }
    });

    pr.on('paymentmethod', async (ev: any) => {
      try {
        if (validateFormRef.current) {
          const validation = validateFormRef.current();
          if (!validation.isValid) {
            ev.complete('fail');
            onPaymentErrorRef.current(validation.error || "Please fill in all required fields");
            return;
          }
        }
        if (validateDeliveryAsyncRef.current) {
          const deliveryValidation = await validateDeliveryAsyncRef.current();
          if (!deliveryValidation.valid) {
            ev.complete('fail');
            onPaymentErrorRef.current(deliveryValidation.error || "Delivery not available to this address");
            return;
          }
        }

        const currentAmount = amountRef.current;
        const currentRestaurantId = restaurantIdRef.current;
        const { clientSecret, paymentIntentId } = await createPaymentIntent(currentAmount, currentRestaurantId);
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          onPaymentErrorRef.current(confirmError.message || 'Payment failed');
        } else if (paymentIntent?.status === 'requires_action') {
          ev.complete('success');
          const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(clientSecret);
          if (error) {
            onPaymentErrorRef.current(error.message || 'Payment authentication failed');
          } else if (confirmedIntent?.status === 'succeeded' || confirmedIntent?.status === 'requires_capture') {
            onPaymentSuccessRef.current(paymentIntentId);
          } else {
            onPaymentErrorRef.current('Payment was not completed');
          }
        } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'requires_capture') {
          ev.complete('success');
          onPaymentSuccessRef.current(paymentIntentId);
        } else {
          ev.complete('fail');
          onPaymentErrorRef.current('Payment was not completed');
        }
      } catch (err: any) {
        ev.complete('fail');
        onPaymentErrorRef.current(err.message || 'Payment failed');
      }
    });

    return () => {
      pr.removeAllListeners();
    };
  }, [stripe, amount, currency, label]);

  useEffect(() => {
    if (paymentRequest && amount > 0) {
      paymentRequest.update({
        total: {
          label: label || 'Order Total',
          amount: Math.round(amount * 100),
        },
      });
    }
  }, [amount, paymentRequest]);

  if (!walletAvailable || !paymentRequest) return null;

  return (
    <div className="w-full" data-testid="wallet-payment-button">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'default',
              theme: 'dark',
              height: '48px',
            },
          },
        }}
      />
    </div>
  );
}

function CardPaymentForm({ amount, restaurantId, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing, children, themeStyle = 'default', validateForm, validateDeliveryAsync }: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name and phone before processing payment
    if (validateForm) {
      const validation = validateForm();
      if (!validation.isValid) {
        onPaymentError(validation.error || "Please fill in all required fields");
        return;
      }
    }
    
    // Async delivery area validation (for radius check)
    if (validateDeliveryAsync) {
      const deliveryValidation = await validateDeliveryAsync();
      if (!deliveryValidation.valid) {
        onPaymentError(deliveryValidation.error || "Delivery not available to this address");
        return;
      }
    }
    
    if (!stripe || !elements) {
      onPaymentError("Payment system not ready. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onPaymentError("Card element not found");
      return;
    }

    setIsProcessing(true);

    try {
      // Send amount in pounds - backend will convert to pence
      const { clientSecret, paymentIntentId } = await createPaymentIntent(amount, restaurantId);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onPaymentError(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        // "requires_capture" means card is authorized - will be charged when restaurant accepts order
        onPaymentSuccess(paymentIntentId);
      } else {
        onPaymentError("Payment was not completed");
        setIsProcessing(false);
      }
    } catch (err: any) {
      onPaymentError(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const isDarkTheme = themeStyle === 'dhaba' || themeStyle === 'shirin' || themeStyle === 'dark';
  
  const cardElementOptions = {
    hidePostalCode: true,
    disableLink: true,
    style: {
      base: {
        fontSize: '16px',
        color: isDarkTheme ? '#ffffff' : '#1f2937',
        backgroundColor: 'transparent',
        '::placeholder': {
          color: isDarkTheme ? '#9ca3af' : '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} id="card-payment-form" data-testid="card-payment-form">
      {children}
      <div className="space-y-2 mt-4">
        <label className="text-sm text-white/90 font-medium block">Card Details</label>
        <div className={`p-4 rounded-lg border ${isDarkTheme ? 'bg-gray-800/80 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-white/50 flex items-center gap-1">
          <CreditCard className="h-3 w-3" /> Card number, MM/YY, CVC
        </p>
      </div>
    </form>
  );
}

function FallbackCardForm({ amount, restaurantId, onPaymentSuccess, onPaymentError, isProcessing, setIsProcessing, themeStyle = 'default', validateForm, validateDeliveryAsync }: Omit<CardPaymentFormProps, 'children'>) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm) {
      const validation = validateForm();
      if (!validation.isValid) { onPaymentError(validation.error || "Please fill in all required fields"); return; }
    }
    if (validateDeliveryAsync) {
      const dv = await validateDeliveryAsync();
      if (!dv.valid) { onPaymentError(dv.error || "Delivery not available"); return; }
    }
    const cleanCard = cardNumber.replace(/\s/g, '');
    const cleanExpiry = expiry.replace(/\s/g, '').replace('/', '');
    if (cleanCard.length < 13) { onPaymentError("Please enter a valid card number"); return; }
    if (cleanExpiry.length < 4) { onPaymentError("Please enter a valid expiry date"); return; }
    if (cvc.length < 3) { onPaymentError("Please enter a valid CVC"); return; }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/process-card-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          restaurantId,
          cardNumber: cleanCard,
          expMonth: parseInt(cleanExpiry.slice(0, 2)),
          expYear: parseInt('20' + cleanExpiry.slice(2)),
          cvc
        })
      });
      const data = await res.json();
      if (!res.ok) { onPaymentError(data.error || "Payment failed"); setIsProcessing(false); return; }
      onPaymentSuccess(data.paymentIntentId);
    } catch (err: any) {
      onPaymentError(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const isDarkTheme = themeStyle === 'dhaba' || themeStyle === 'shirin' || themeStyle === 'dark';
  const inputClass = `w-full px-3 py-3 rounded-lg border text-base outline-none transition-colors ${isDarkTheme ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'}`;

  return (
    <form onSubmit={handleSubmit} id="card-payment-form" data-testid="card-payment-form">
      <div className="space-y-3 mt-4">
        <label className="text-sm text-white/90 font-medium block">Card Details</label>
        <div>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1234 1234 1234 1234"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className={inputClass}
            data-testid="input-card-number"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM / YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className={inputClass}
            data-testid="input-card-expiry"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={inputClass}
            data-testid="input-card-cvc"
          />
        </div>
        <p className="text-xs text-white/50 flex items-center gap-1">
          <CreditCard className="h-3 w-3" /> Your card details are secure
        </p>
      </div>
    </form>
  );
}

const ROYAL_THEME = {
  primary: "#8B0000",
  secondary: "#FFD700", 
  accent: "#4A0E4E",
  dark: "#1a1a2e",
  gradient: {
    hero: "linear-gradient(135deg, #1a1a2e 0%, #4A0E4E 50%, #8B0000 100%)",
    card: "linear-gradient(145deg, #ffffff 0%, #fff8f0 100%)",
    button: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)",
    category: "linear-gradient(90deg, #8B0000 0%, #4A0E4E 100%)",
  }
};

const DIXY_PREMIUM_THEME = {
  primary: "#E31E24",
  secondary: "#FFD700",
  accent: "#FF6B35",
  dark: "#0f0c29",
  gradient: {
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 25%, #24243e 50%, #1a1a2e 75%, #0f0c29 100%)",
    header: "linear-gradient(135deg, #E31E24 0%, #b91c1c 50%, #991b1b 100%)",
    sidebar: "linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
    card: "linear-gradient(145deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.9) 50%, rgba(30, 27, 75, 0.95) 100%)",
    button: "linear-gradient(135deg, #E31E24 0%, #FF6B35 50%, #FFD700 100%)",
    categoryBanner: "linear-gradient(135deg, #E31E24 0%, #b91c1c 100%)",
  }
};

const EMPARO_THEME = {
  primary: "#722F37",
  secondary: "#F97316",
  accent: "#FFD700",
  dark: "#1a1a1a",
  cream: "#f5f0e8",
  gradient: {
    hero: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
    header: "linear-gradient(135deg, #722F37 0%, #5a252d 100%)",
    button: "linear-gradient(135deg, #F97316 0%, #ea580c 100%)",
    categoryBanner: "linear-gradient(135deg, #722F37 0%, #5a252d 100%)",
  }
};

const DHABA_THEME = {
  primary: "#0b1d3a",
  secondary: "#c9a646",
  accent: "#f6c343",
  green: "#1f6f4d",
  dark: "#0a1628",
  cream: "#faf8f3",
  gradient: {
    hero: "linear-gradient(135deg, #0b1d3a 0%, #132744 50%, #0b1d3a 100%)",
    header: "linear-gradient(135deg, #0b1d3a 0%, #1a3a5c 100%)",
    button: "linear-gradient(135deg, #c9a646 0%, #f6c343 50%, #c9a646 100%)",
    categoryBanner: "linear-gradient(135deg, #1f6f4d 0%, #2d8a5e 100%)",
    card: "linear-gradient(145deg, rgba(11, 29, 58, 0.95) 0%, rgba(19, 39, 68, 0.9) 100%)",
    gold: "linear-gradient(135deg, #c9a646 0%, #f6c343 100%)",
  }
};

const SPICY_THEME = {
  primary: "#dc2626",
  secondary: "#1e3a5f",
  accent: "#22c55e",
  dark: "#0f172a",
  cream: "#f8fafc",
  gradient: {
    hero: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 35%, #22c55e 65%, #0f172a 100%)",
    header: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 50%, #0f172a 100%)",
    button: "linear-gradient(135deg, #dc2626 0%, #22c55e 100%)",
    categoryBanner: "linear-gradient(135deg, #dc2626 0%, #1e3a5f 50%, #22c55e 100%)",
    card: "linear-gradient(145deg, rgba(30, 58, 95, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)",
    section1: "linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)",
    section2: "linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)",
    section3: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
  }
};

const AFGHAN_ROYAL_THEME = {
  primary: "#2d1b69",
  secondary: "#c9a646",
  accent: "#f6d365",
  gold: "#c9a646",
  deepPurple: "#1a1040",
  royalPurple: "#3d2180",
  burgundy: "#7c1034",
  text: "#ffffff",
  cream: "#ffeaa7",
  darkBg: "#0c0a1d",
  gradient: {
    background: 'linear-gradient(180deg, #0c0a1d 0%, #1a1040 25%, #2d1b69 50%, #1a1040 75%, #0c0a1d 100%)',
    header: 'linear-gradient(135deg, #1a1040 0%, #3d2180 25%, #c9a646 50%, #3d2180 75%, #1a1040 100%)',
    hero: 'linear-gradient(180deg, rgba(45, 27, 105, 0.95) 0%, rgba(26, 16, 64, 0.9) 50%, rgba(12, 10, 29, 0.95) 100%)',
    gold: 'linear-gradient(135deg, #c9a646 0%, #f6d365 25%, #ffeaa7 50%, #f6d365 75%, #c9a646 100%)',
    card: 'linear-gradient(145deg, rgba(45, 27, 105, 0.9) 0%, rgba(26, 16, 64, 0.95) 100%)',
    button: 'linear-gradient(135deg, #c9a646 0%, #f6d365 50%, #c9a646 100%)',
    categoryBanner: 'linear-gradient(135deg, #2d1b69 0%, #c9a646 50%, #2d1b69 100%)',
    ornate: 'linear-gradient(45deg, #c9a646, #f6d365, #c9a646, #f6d365, #c9a646)',
  }
};

// Category Media Slider Component - Auto-cycles through image, GIF, video
function CategoryMediaSlider({ 
  media, 
  categoryName, 
  categoryDescription 
}: { 
  media: { type: 'image' | 'gif' | 'video'; url: string }[]; 
  categoryName: string;
  categoryDescription?: string | null;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  React.useEffect(() => {
    if (media.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [media.length]);
  
  const currentMedia = media[currentIndex];
  
  return (
    <div className="mb-6 rounded-2xl overflow-hidden relative" style={{ aspectRatio: '16/6' }}>
      {media.map((item, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        >
          {item.type === 'video' ? (
            <video 
              src={item.url} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={item.url} 
              alt={categoryName}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 pointer-events-none" />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div>
          <h3 
            className="text-2xl md:text-3xl font-bold text-white"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)' }}
          >
            {categoryName}
          </h3>
          {categoryDescription && (
            <p className="text-white text-sm mt-1" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.9)' }}>{categoryDescription}</p>
          )}
        </div>
        {media.length > 1 && (
          <div className="flex gap-1.5">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Nandini's Maharaj Theme - Vibrant Indian colors with peacock-inspired gradients
const MAHARAJ_THEME = {
  primary: "#FF6B35",      // Saffron orange
  secondary: "#1E88E5",    // Peacock blue
  accent: "#FFD700",       // Gold
  purple: "#9C27B0",       // Royal purple
  green: "#4CAF50",        // Emerald green
  pink: "#E91E63",         // Bright pink
  teal: "#00BCD4",         // Peacock teal
  darkBg: "#1a0a2e",       // Deep purple background
  text: "#ffffff",
  gradient: {
    background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 25%, #4a1c6b 50%, #2d1b4e 75%, #1a0a2e 100%)',
    hero: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 25%, #9C27B0 50%, #1E88E5 75%, #00BCD4 100%)',
    header: 'linear-gradient(90deg, #FF6B35 0%, #E91E63 20%, #9C27B0 40%, #1E88E5 60%, #00BCD4 80%, #4CAF50 100%)',
    card: 'linear-gradient(145deg, rgba(156, 39, 176, 0.15) 0%, rgba(30, 136, 229, 0.15) 50%, rgba(0, 188, 212, 0.15) 100%)',
    cardBorder: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 25%, #9C27B0 50%, #1E88E5 75%, #00BCD4 100%)',
    button: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 50%, #9C27B0 100%)',
    categoryCard: 'linear-gradient(135deg, #9C27B0 0%, #1E88E5 50%, #00BCD4 100%)',
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFA000 50%, #FF6B35 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
  }
};

const DHABA_CATEGORIES = [
  { id: "chefs-special", name: "Chef's Special" },
  { id: "special-offers", name: "Special Offers" },
  { id: "starters", name: "Starters" },
  { id: "weekend-special", name: "Weekend Special" },
  { id: "student-offer", name: "Student Offer" },
  { id: "curries", name: "Curries" },
  { id: "vegetable-curries", name: "Vegetable Curries" },
  { id: "platters", name: "Platters to Share" },
  { id: "naan-bread", name: "Naan/Bread" },
  { id: "drinks", name: "Drinks" },
  { id: "desserts", name: "Desserts" },
];

const MENU_CATEGORIES = [
  // Emparo Peri Peri categories
  { id: "starters-sides", name: "Starters/Sides" },
  { id: "pizza-9-inch", name: "Pizza 9\"" },
  { id: "pizza-12-large", name: "Pizza 12\" Large" },
  { id: "grilled-chicken", name: "Grilled Chicken" },
  { id: "grilled-burgers-wraps", name: "Grilled Burgers and Wraps" },
  { id: "emparo-fried-chicken", name: "Emparo Fried Chicken" },
  { id: "emparo-collection-special", name: "Emparo Collection Special" },
  { id: "emparo-peri-peri", name: "Emparo Peri Peri" },
  { id: "emparo-platters", name: "Platters" },
  { id: "meal-deals", name: "Meal Deals" },
  { id: "emparo-drinks", name: "Drinks" },
  { id: "emparo-desserts", name: "Desserts" },
  { id: "emparo-shakes", name: "Emparo Shakes" },
  // Original PPO categories
  { id: "platters", name: "PPO PLATTERS" },
  { id: "family-bucket", name: "PPO FEAST FAMILY BUCKET" },
  { id: "peri-peri", name: "PERI PERI ORIGINAL" },
  { id: "beef-burgers", name: "ORIGINAL GOURMET BEEF BURGERS" },
  { id: "chicken-burgers", name: "ORIGINAL GOURMET CHICKEN BURGERS" },
  { id: "other-menus", name: "OTHER MENUS" },
  { id: "fried-chicken", name: "FRIED CHICKEN" },
  { id: "burgers", name: "BURGERS / SANDWICHES" },
  { id: "sauces", name: "SAUCES" },
  { id: "sides", name: "SIDES" },
  { id: "kids", name: "KIDS MENU" },
  { id: "milkshakes", name: "SHAKE BAR" },
  { id: "drinks", name: "DRINKS" },
  // Top Dixie Chicken / Uber Eats categories
  { id: "extras", name: "Extras" },
  { id: "wraps", name: "Wraps" },
  { id: "sauce-dips", name: "Sauce Dips" },
  { id: "bucket-family", name: "Bucket Family" },
  { id: "chicken", name: "Chicken" },
  { id: "wings", name: "Wings" },
  { id: "bbq-wings", name: "BBQ Wings" },
  { id: "bbq-ribs", name: "BBQ Ribs" },
  { id: "chicken-strips", name: "Chicken Strips" },
  { id: "pizza-offer", name: "PIZZA OFFER" },
  { id: "9-small-pizza", name: "9\" Small Pizza" },
  { id: "12-medium-pizza", name: "12\" Medium Pizza" },
  { id: "15-large-pizza", name: "15\" Large Pizza" },
  { id: "kids-meals", name: "Kids Meals" },
  { id: "main-meals", name: "Main Meals" },
  { id: "desserts", name: "Desserts" },
  { id: "family-special-offers", name: "FAMILY SPECIAL OFFERS" },
  { id: "new-items", name: "New Items" },
  { id: "biryani", name: "Biryani" },
  // Dixy Walsall categories
  { id: "burger-meals", name: "Burger Meals" },
  { id: "dixy-box-meals", name: "Dixy Box Meals" },
  { id: "panini-meals", name: "Panini Meals" },
  { id: "tortilla-wrap-meals", name: "Tortilla Wrap Meals" },
  { id: "peri-peri-chicken-meals", name: "Peri Peri Chicken Meals" },
  { id: "dixy-buckets", name: "Dixy Buckets" },
  { id: "family-feast-deals", name: "Family Feast Deals" },
  { id: "pizza", name: "Pizza" },
  { id: "southern-fried-chicken-meals", name: "Southern Fried Chicken Meals" },
  { id: "bbq-chicken", name: "Bbq Chicken" },
  { id: "dixy-rice-box", name: "Dixy Rice Box" },
  { id: "snack-packs", name: "Snack Packs" },
  { id: "healthy-salad", name: "Healthy Salad" },
  { id: "dips", name: "Dips" },
  { id: "drinks-desserts", name: "Drinks & Desserts" },
];

const CATEGORY_IMAGES: Record<string, string[]> = {
  "platters": [
    "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&h=200&fit=crop",
  ],
  "family-bucket": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
  ],
  "peri-peri": [
    "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=200&fit=crop",
  ],
  "beef-burgers": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1550317138-10000687a72b?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=200&fit=crop",
  ],
  "chicken-burgers": [
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1615297928064-24977384d0da?w=300&h=200&fit=crop",
  ],
  "other-menus": [
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=200&fit=crop",
  ],
  "fried-chicken": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=200&fit=crop",
  ],
  "burgers": [
    "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=200&fit=crop",
  ],
  "sauces": [
    "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=300&h=200&fit=crop",
  ],
  "sides": [
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=300&h=200&fit=crop",
  ],
  "kids": [
    "https://images.unsplash.com/photo-1619881589928-a1a3c5f7ed71?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?w=300&h=200&fit=crop",
  ],
  "milkshakes": [
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1568901839119-631418a3910d?w=300&h=200&fit=crop",
  ],
  "drinks": [
    "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=300&h=200&fit=crop",
  ],
  "pizza-offer": [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop",
  ],
  "9-small-pizza": [
    "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=300&h=200&fit=crop",
  ],
  "12-medium-pizza": [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?w=300&h=200&fit=crop",
  ],
  "15-large-pizza": [
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=300&h=200&fit=crop",
  ],
  "kids-meals": [
    "https://images.unsplash.com/photo-1619881589928-a1a3c5f7ed71?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=200&fit=crop",
  ],
  "desserts": [
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&h=200&fit=crop",
  ],
  "extras": [
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=300&h=200&fit=crop",
  ],
  "wraps": [
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=300&h=200&fit=crop",
  ],
  "sauce-dips": [
    "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1576506542790-51244b486a6b?w=300&h=200&fit=crop",
  ],
  "bucket-family": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1598932465565-1e4a0a7a5d18?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop",
  ],
  "chicken": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=200&fit=crop",
  ],
  "wings": [
    "https://images.unsplash.com/photo-1608039858788-667850f129f6?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=200&fit=crop",
  ],
  "bbq-wings": [
    "https://images.unsplash.com/photo-1608039858788-667850f129f6?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=200&fit=crop",
  ],
  "bbq-ribs": [
    "https://images.unsplash.com/photo-1544025162-d76978e8e5e0?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop",
  ],
  "chicken-strips": [
    "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=300&h=200&fit=crop",
  ],
  "main-meals": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=200&fit=crop",
  ],
  "family-special-offers": [
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1585325701165-351af831e8e1?w=300&h=200&fit=crop",
  ],
  "new-items": [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=200&fit=crop",
  ],
  "biryani": [
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=300&h=200&fit=crop",
  ],
};

const getItemImage = (category: string, index: number): string => {
  const images = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["peri-peri"];
  return images[index % images.length];
};

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const welcomeUrl = useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isSubdomain = hostname.endsWith('.link24.online') && hostname !== 'link24.online' && hostname !== 'www.link24.online';
    const isCustomDomain = !hostname.includes('replit') && !hostname.includes('localhost') && !hostname.includes('127.0.0.1') && hostname !== 'link24.online' && hostname !== 'www.link24.online' && !isSubdomain;
    if (isSubdomain || isCustomDomain) {
      return '/';
    }
    return `/${slug}/welcome`;
  }, [slug]);
  
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // PWA Install state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsPWAInstalled(standalone);
    
    // Detect iOS for special install instructions
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    
    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Show install button for iOS after a delay
    if (isIOSDevice && !standalone) {
      setTimeout(() => setShowInstallButton(true), 1500);
    }
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  
  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
        setDeferredInstallPrompt(null);
      }
    } else if (isIOS) {
      toast({
        title: "Install on iOS",
        description: "Tap the Share button at the bottom of Safari, then tap 'Add to Home Screen'",
      });
    }
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [addCutlery, setAddCutlery] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [showSearch, setShowSearch] = useState(false);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<"takeaway" | "delivery" | "dine-in">("takeaway");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [deliveryAreaError, setDeliveryAreaError] = useState<string | null>(null);
  
  // Dixy sliding pages state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  
  // Login states
  const [showLogin, setShowLogin] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  
  // Booking states
  const [showBooking, setShowBooking] = useState(false);
  const [showWatfordBookingInline, setShowWatfordBookingInline] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [bookingTime, setBookingTime] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [specialHelp, setSpecialHelp] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingSpecialRequests, setBookingSpecialRequests] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingCountryCode, setBookingCountryCode] = useState("+44");
  const [showAllergenMatrix, setShowAllergenMatrix] = useState(false);
  const [allergenSearchQuery, setAllergenSearchQuery] = useState("");
  
  // Dasi Food Hub sparkle cursor states
  const [dasiSparkles, setDasiSparkles] = useState<Array<{id: number; x: number; y: number; color: string; size: number; rotation: number}>>([]);
  const [dasiCursorPos, setDasiCursorPos] = useState({ x: 0, y: 0 });
  const [dasiSlideIndex, setDasiSlideIndex] = useState(0);
  const dasiSparkleIdRef = useRef(0);
  const dasiMagicSoundRef = useRef<HTMLAudioElement | null>(null);
  const dasiVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Cart item edit state
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [tempRemovedIngredients, setTempRemovedIngredients] = useState<string[]>([]);
  
  // Cart item extras state
  const [addingExtrasToItem, setAddingExtrasToItem] = useState<CartItem | null>(null);
  const [tempSelectedExtras, setTempSelectedExtras] = useState<string[]>([]);
  const [showExtrasStep, setShowExtrasStep] = useState(false);
  const [showDhabaExtras, setShowDhabaExtras] = useState(false);
  const [showEmparoExtras, setShowEmparoExtras] = useState(false);
  const [showBurgerExtras, setShowBurgerExtras] = useState(false);
  const [showRoyalExtras, setShowRoyalExtras] = useState(false);
  const [showMaharajExtras, setShowMaharajExtras] = useState(false);
  const [showTawaExtras, setShowTawaExtras] = useState(false);
  
  // Option group selection state (for items with attached option groups)
  const [itemWithOptionsDialog, setItemWithOptionsDialog] = useState<MenuItemType | null>(null);
  
  // Pending variant info when adding variant with option groups
  const [pendingVariant, setPendingVariant] = useState<{variantId: string, variantName: string, variantPrice: number} | null>(null);
  
  // Order tracking state
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<{
    delivery: { status: string; acceptedAt?: string; pickedUpAt?: string; deliveredAt?: string } | null;
    driver: { name: string; phone: string; vehicleType: string } | null;
    driverLocation: { lat: number; lng: number } | null;
    restaurant: { name: string; address: string } | null;
  } | null>(null);
  const [showDriverMap, setShowDriverMap] = useState(false);
  
  // Stripe payment state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [stripeLoadAttempted, setStripeLoadAttempted] = useState(false);
  const [stripeLoadFinished, setStripeLoadFinished] = useState(false);
  const [stripeActuallyLoaded, setStripeActuallyLoaded] = useState(false);

  useEffect(() => {
    if (orderType === "delivery") {
      setPaymentMethod("card");
    }
  }, [orderType]);
  const [cardAvailable, setCardAvailable] = useState(true);
  
  // Tawa slider state
  const [tawaSliderIndex, setTawaSliderIndex] = useState(0);
  const TAWA_HERO_IMAGES = [
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=1200&h=600&fit=crop",
    "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200&h=600&fit=crop",
  ];
  
  // Emparo variation selection state - persist category in localStorage
  const [emparoShowWelcome, setEmparoShowWelcome] = useState(true);
  const [emparoSelectedCategory, setEmparoSelectedCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('emparoSelectedCategory') || null;
    }
    return null;
  });
  const [showEmparoSidebar, setShowEmparoSidebar] = useState(false);
  const [emparoSelectedVariation, setEmparoSelectedVariation] = useState<MenuItemType | null>(null);
  
  // State for expanded sidebar parent categories (hierarchical dropdowns)
  const [expandedSidebarParents, setExpandedSidebarParents] = useState<string[]>([]);
  const [emparoQuantity, setEmparoQuantity] = useState(1);
  const [emparoOfferCode, setEmparoOfferCode] = useState("");
  const [emparoCartOpen, setEmparoCartOpen] = useState(false);
  
  // Persist Emparo category selection to localStorage
  useEffect(() => {
    if (emparoSelectedCategory) {
      localStorage.setItem('emparoSelectedCategory', emparoSelectedCategory);
    } else {
      localStorage.removeItem('emparoSelectedCategory');
    }
  }, [emparoSelectedCategory]);
  
  // Premium mix colors for Emparo category pills - matching header gradient
  const EMPARO_PILL_COLORS = [
    'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', // gold/amber
    'linear-gradient(135deg, #F97316 0%, #ea580c 100%)', // orange
    'linear-gradient(135deg, #722F37 0%, #8B3A42 100%)', // maroon/wine
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // red
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // emerald green
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // blue
    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', // purple
    'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', // pink
    'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', // teal
    'linear-gradient(135deg, #f472b6 0%, #e879f9 100%)', // pink-purple
  ];
  
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const emparoPillsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dhabaCategoriesRef = useRef<HTMLDivElement>(null);
  
  const [playClick] = useSound("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", { volume: 0.25 });
  const [playHover] = useSound("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.1 });
  
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? categoryScrollRef.current.scrollLeft - scrollAmount
        : categoryScrollRef.current.scrollLeft + scrollAmount;
      categoryScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollEmparoPills = (direction: 'left' | 'right') => {
    if (emparoPillsRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? emparoPillsRef.current.scrollLeft - scrollAmount
        : emparoPillsRef.current.scrollLeft + scrollAmount;
      emparoPillsRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const scrollDhabaCategories = (direction: 'left' | 'right') => {
    if (dhabaCategoriesRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? dhabaCategoriesRef.current.scrollLeft - scrollAmount
        : dhabaCategoriesRef.current.scrollLeft + scrollAmount;
      dhabaCategoriesRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["/api/restaurants", slug],
    queryFn: () => getRestaurantBySlug(slug || ""),
    enabled: !!slug,
  });
  const hasStripeKeys = !!(restaurant?.stripePublishableKey && restaurant?.stripeSecretKey);

  useRestaurantPwaBranding(slug, restaurant?.name, restaurant?.logoUrl || undefined, restaurant?.primaryColor || undefined);

  // Fetch branch features to control what's available
  const { data: branchFeatures } = useQuery({
    queryKey: ["/api/branch-features", restaurant?.id],
    queryFn: () => getBranchFeatures(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  // Feature flags - if not loaded yet, default to true to avoid hiding during load
  const isOnlineOrderingEnabled = branchFeatures?.onlineOrdering ?? true;
  const isTableBookingEnabled = branchFeatures?.tableBooking ?? true;
  const isDeliveryTrackingEnabled = branchFeatures?.deliveryTracking ?? true;
  const isPromotionsEnabled = branchFeatures?.promotions ?? true;

  // Helper functions to check features before allowing actions
  const openBookingIfEnabled = () => {
    if (!isTableBookingEnabled) {
      toast({
        title: "Table Booking Unavailable",
        description: "Online table booking is currently not available for this location.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const canAddToCart = () => {
    if (!isOnlineOrderingEnabled) {
      toast({
        title: "Online Ordering Unavailable", 
        description: "Online ordering is currently not available for this location. Please call to order.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Dasi Food Hub cursor effects
  useEffect(() => {
    if (restaurant?.slug === "dasi-food-hub") {
      dasiMagicSoundRef.current = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_14c03cb0f4.mp3');
      dasiMagicSoundRef.current.volume = 0.3;
    }
  }, [restaurant?.slug]);

  useEffect(() => {
    if (restaurant?.slug === "dasi-food-hub") {
      const handleMouseMove = (e: MouseEvent) => {
        setDasiCursorPos({ x: e.clientX, y: e.clientY });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [restaurant?.slug]);

  // Dasi Food Hub background configuration - uses MENU-specific settings (NOT welcome page settings)
  // Menu and Welcome pages have completely separate background settings
  const dasiHeroVideo = (restaurant as any)?.menuBackgroundVideoUrl || restaurant?.heroVideoUrl;
  const dasiHeroGif = restaurant?.heroGifUrl;
  const dasiBackgroundType = (restaurant as any)?.menuBackgroundType || "gradient";
  const dasiStaticImage = (restaurant as any)?.menuBackgroundImageUrl;
  const dasiRestaurantSliderImages = restaurant?.welcomeSliderImages as string[] | undefined;

  const DASI_RAINBOW_COLORS = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3', '#ff1493', '#00ffff', '#ff69b4', '#ffd700', '#7fff00'];

  const handleDasiClick = useCallback((e: React.MouseEvent) => {
    if (dasiMagicSoundRef.current) {
      dasiMagicSoundRef.current.currentTime = 0;
      dasiMagicSoundRef.current.play().catch(() => {});
    }
    const newSparkles: Array<{id: number; x: number; y: number; color: string; size: number; rotation: number}> = [];
    for (let i = 0; i < 12; i++) {
      newSparkles.push({
        id: dasiSparkleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        color: DASI_RAINBOW_COLORS[i % DASI_RAINBOW_COLORS.length],
        size: Math.random() * 20 + 10,
        rotation: Math.random() * 360,
      });
    }
    setDasiSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setDasiSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
    }, 1000);
  }, []);

  // Wrapper to open booking with feature check
  const openBooking = () => {
    if (openBookingIfEnabled()) {
      setShowBooking(true);
    }
  };

  // Use themeKey from database instead of hardcoded slugs
  const themeKeyNormalized = restaurant?.themeKey?.toLowerCase().replace(/[\s-]/g, '');
  const isRoyalTheme = restaurant?.themeKey === "royal" || themeKeyNormalized === "afghanroyal";
  const isDixyTheme = restaurant?.themeKey === "dixy";
  const isTawaTheme = restaurant?.themeKey === "tawa";
  const isTawaWatfordTheme = restaurant?.themeKey === "tawa-watford";
  const isEmparoTheme = restaurant?.themeKey === "emparo";
  const isDhabaTheme = restaurant?.themeKey === "dhaba";
  const isSpicyTheme = restaurant?.themeKey === "spicy";
  const isBurgerTheme = restaurant?.themeKey === "burger";
  const isMaharajTheme = restaurant?.themeKey === "maharaj";
  const isHelloMumbaiTheme = restaurant?.themeKey === "hello-mumbai";
  const isMujeebSweetsTheme = restaurant?.themeKey === "mujeeb-sweets";
  const isShirinMahalTheme = restaurant?.themeKey === "shirin-mahal";
  const isDasiFoodHubTheme = restaurant?.slug === "dasi-food-hub";
  
  // Shirin Mahal Lakers-style theme colors with rainbow
  const SHIRIN_MAHAL_THEME = {
    gold: '#d4af37',
    purple: '#1a1a2e',
    purpleLight: '#2d2d4a',
    gradient: {
      header: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 50%, #1a1a2e 100%)',
      card: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08) 0%, rgba(26, 26, 46, 0.95) 100%)',
      rainbow: 'linear-gradient(135deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 57%, #4b0082 71%, #9400d3 85%, #ff1493 100%)',
    }
  };
  
  // Dasi Food Hub Rainbow Watercolor Theme
  const DASI_THEME = {
    gradient: {
      rainbow: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 20%, #1dd1a1 40%, #48dbfb 60%, #ff9ff3 80%, #5f27cd 100%)',
      header: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
      card: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
    },
    colors: {
      primary: '#ff6b6b',
      accent: '#feca57',
      text: '#2d3436',
    }
  };
  
  // Get generic theme from themes object (for themes like classic, modern, rustic, etc.)
  const genericTheme = restaurant?.themeKey ? themes[restaurant.themeKey] : null;
  const hasGenericTheme = genericTheme && !isRoyalTheme && !isDixyTheme && !isTawaTheme && !isTawaWatfordTheme && !isEmparoTheme && !isDhabaTheme && !isSpicyTheme && !isBurgerTheme && !isMaharajTheme && !isHelloMumbaiTheme && !isMujeebSweetsTheme && !isShirinMahalTheme && !isDasiFoodHubTheme;
  
  // Category display position - sidebar, header, or cards (only for generic themes)
  const showCategorySidebar = hasGenericTheme && restaurant?.categoryDisplayPosition === 'sidebar';
  const showCategoryCards = restaurant?.categoryDisplayPosition === 'cards';
  const showCategoryHeader = hasGenericTheme && restaurant?.categoryDisplayPosition === 'header';
  
  const currencySymbol = getCurrencySymbol(restaurant?.currency || "GBP");
  
  const [dhabaSelectedCategory, setDhabaSelectedCategory] = useState<string>("chefs-special");
  const [dhabaMobileMenuOpen, setDhabaMobileMenuOpen] = useState(false);
  const [dhabaHeroIndex, setDhabaHeroIndex] = useState(0);
  const [dixyMobileMenuOpen, setDixyMobileMenuOpen] = useState(false);
  const [royalMobileMenuOpen, setRoyalMobileMenuOpen] = useState(false);
  const [maharajMobileMenuOpen, setMaharajMobileMenuOpen] = useState(false);

  // Manual horizontal scrolling for Emparo category pills (auto-scroll removed)
  
  const TAWA_THEME = {
    gradient: {
      header: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)',
      sidebar: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      categoryBanner: 'linear-gradient(90deg, #d97706 0%, #ea580c 100%)',
    },
    colors: {
      primary: '#d97706',
      accent: '#ea580c',
    }
  };

  const TAWA_WATFORD_THEME = {
    gradient: {
      header: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
      sidebar: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 100%)',
      categoryBanner: 'linear-gradient(90deg, #1e3a5f 0%, #c9a646 100%)',
      hero: 'linear-gradient(135deg, #0f1c2e 0%, #1e3a5f 50%, #2d5a87 100%)',
    },
    colors: {
      primary: '#1e3a5f',
      accent: '#c9a646',
      secondary: '#2d5a87',
      gold: '#c9a646',
      text: '#ffffff',
    }
  };

  const HELLO_MUMBAI_THEME = {
    gradient: {
      header: 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6347 100%)',
      sidebar: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%)',
      categoryBanner: 'linear-gradient(90deg, #DC143C 0%, #FFD700 100%)',
      hero: 'linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF4500 100%)',
    },
    colors: {
      primary: '#DC143C',
      accent: '#FFD700',
      secondary: '#FF6347',
      gold: '#FFD700',
      text: '#ffffff',
      dark: '#1a1a1a',
    }
  };

  const { data: menuItemsWithVariants = [], isLoading: loadingMenuWithVariants } = useQuery({
    queryKey: ["/api/menu-with-variants", restaurant?.id],
    queryFn: () => getMenuItemsWithVariants(restaurant?.id!),
    enabled: !!restaurant?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const menuItems = menuItemsWithVariants;


  const { data: promotion } = useQuery<Promotion | null>({
    queryKey: ["/api/promotions", restaurant?.id],
    queryFn: () => getPromotion(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  const { data: dbCategories = [] } = useQuery({
    queryKey: ["/api/menu-categories", restaurant?.id],
    queryFn: async () => {
      const url = restaurant?.id 
        ? `/api/menu-categories?restaurantId=${restaurant.id}`
        : "/api/menu-categories";
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!restaurant?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Build dynamic categories from database
  const dynamicCategories = useMemo(() => {
    // If no database categories exist, return empty array (no fallback data)
    if (dbCategories.length === 0) {
      return [];
    }
    
    // De-duplicate by id, preferring branch-specific (restaurantId matches) over global (null)
    const byId = new Map<string, { id: string; slug: string; name: string; icon: string; displayName?: string; imageUrl?: string; videoUrl?: string; gifUrl?: string; parentId?: string | null }>();
    for (const cat of dbCategories) {
      const existing = byId.get(cat.id);
      // Prefer branch-specific (has restaurantId) over global (null)
      if (!existing || cat.restaurantId) {
        byId.set(cat.id, {
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon || "🍽️",
          displayName: cat.name,
          imageUrl: cat.imageUrl || undefined,
          videoUrl: cat.videoUrl || undefined,
          gifUrl: cat.gifUrl || undefined,
          parentId: cat.parentId || null,
        });
      }
    }
    return Array.from(byId.values());
  }, [dbCategories]);

  // Filter categories to only show ones that have menu items for this restaurant
  const categoriesWithItems = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    const menuItemCategories = new Set(menuItems.map((item: any) => item.category));
    const menuItemCategorySlugs = new Set(menuItems.map((item: any) => item.categorySlug).filter(Boolean));
    return dbCategories.filter((cat: any) => 
      menuItemCategories.has(cat.id) || 
      menuItemCategories.has(cat.slug) || 
      menuItemCategorySlugs.has(cat.slug)
    );
  }, [dbCategories, menuItems]);

  // Organize categories into hierarchical structure for sidebar dropdowns
  // Only shows categories that have menu items (or have children with items)
  const hierarchicalCategories = useMemo(() => {
    // Get IDs of categories that have items
    const categoriesWithItemsIds = new Set(categoriesWithItems.map((c: any) => c.id));
    
    // All categories from dynamicCategories (includes parentId info)
    const allCategories = dynamicCategories;
    
    // Get parent categories (no parentId)
    const parentCategories = allCategories.filter(c => !c.parentId);
    const childCategories = allCategories.filter(c => c.parentId);
    
    // Build hierarchy: only include children that have items
    const result: Array<typeof dynamicCategories[0] & { children: typeof dynamicCategories }> = [];
    
    for (const parent of parentCategories) {
      // Get children that have items
      const childrenWithItems = childCategories.filter(child => 
        child.parentId === parent.id && categoriesWithItemsIds.has(child.id)
      );
      
      // Include parent if: it has items OR it has children with items
      const parentHasItems = categoriesWithItemsIds.has(parent.id);
      const hasChildrenWithItems = childrenWithItems.length > 0;
      
      if (parentHasItems || hasChildrenWithItems) {
        result.push({
          ...parent,
          children: childrenWithItems,
        });
      }
    }
    
    // Also include any orphaned children (children whose parent isn't in our list) that have items
    const parentIds = new Set(parentCategories.map(p => p.id));
    const orphanedChildren = childCategories.filter(child => 
      child.parentId && 
      !parentIds.has(child.parentId) && 
      categoriesWithItemsIds.has(child.id)
    );
    orphanedChildren.forEach(orphan => {
      result.push({ ...orphan, children: [] });
    });
    
    return result;
  }, [dynamicCategories, categoriesWithItems]);
  
  // Auto-expand parent when a child is active
  useEffect(() => {
    if (activeCategoryId) {
      const activeChild = dynamicCategories.find(c => c.id === activeCategoryId && c.parentId);
      if (activeChild?.parentId && !expandedSidebarParents.includes(activeChild.parentId)) {
        setExpandedSidebarParents(prev => [...prev, activeChild.parentId!]);
      }
    }
  }, [activeCategoryId, dynamicCategories, expandedSidebarParents]);

  // Toggle sidebar parent category expansion
  const toggleSidebarParent = (parentId: string) => {
    setExpandedSidebarParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    );
  };

  // Initialize expanded categories when dynamicCategories loads
  useEffect(() => {
    if (dynamicCategories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(dynamicCategories.map(c => c.id));
    }
  }, [dynamicCategories, expandedCategories.length]);

  // Initialize Stripe when card payment is selected (using restaurant-specific keys)
  useEffect(() => {
    if (paymentMethod === "card" && !stripePromise && !stripeLoadAttempted && restaurant?.id) {
      setStripeLoadAttempted(true);
      getStripeConfig(restaurant.id).then(config => {
        var cleanKey = config.publishableKey ? config.publishableKey.replace(/[^\x20-\x7E]/g, '').trim() : null;
        if (cleanKey && (cleanKey.startsWith('pk_test_') || cleanKey.startsWith('pk_live_'))) {
          const stripeP = loadStripe(cleanKey).then(stripe => {
            if (stripe) {
              setStripeActuallyLoaded(true);
            }
            setStripeLoadFinished(true);
            return stripe;
          }).catch(err => {
            console.warn("Stripe load failed, using fallback card form:", err);
            setStripeLoadFinished(true);
            return null;
          });
          setStripePromise(stripeP);
          setCardAvailable(true);
        } else {
          setStripeLoadFinished(true);
          setCardAvailable(true);
        }
      }).catch(err => {
        console.error("Failed to load Stripe config:", err);
        setStripeLoadFinished(true);
        setCardAvailable(true);
      });
    }
  }, [paymentMethod, stripePromise, stripeLoadAttempted, restaurant?.id]);

  // Fetch extra toppings for this restaurant
  const { data: extraToppings = [] } = useQuery<ExtraTopping[]>({
    queryKey: ["/api/extra-toppings", restaurant?.id],
    queryFn: () => getExtraToppings(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  // Show all toppings - inactive ones display as "Sold Out"
  const activeToppings = extraToppings;

  // Fetch topping groups (option groups like "Choose Your Drink")
  const { data: toppingGroups = [] } = useQuery<ToppingGroupWithOptions[]>({
    queryKey: ["/api/topping-groups", restaurant?.id],
    queryFn: () => getToppingGroups(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  // Memoized lookup for topping groups by menuItemId (ensure string keys for consistent lookup)
  const groupsByMenuItemId = useMemo(() => {
    const map = new Map<string, ToppingGroupWithOptions[]>();
    toppingGroups.forEach(group => {
      const key = String(group.menuItemId);
      const existing = map.get(key) || [];
      existing.push(group);
      map.set(key, existing);
    });
    return map;
  }, [toppingGroups]);

  // Get groups for a specific menu item (ensure string comparison)
  const getGroupsForItem = (menuItemId: string) => groupsByMenuItemId.get(String(menuItemId)) || [];

  // State for tracking option group selections during add-to-cart flow
  const [tempOptionGroupSelections, setTempOptionGroupSelections] = useState<Record<string, string[]>>({});
  const [tempOptionGroupQuantities, setTempOptionGroupQuantities] = useState<Record<string, Record<string, number>>>({});

  // Validate if all required groups have selections and minimum selections are met
  const validateOptionGroups = (menuItemId: string): { valid: boolean; missingGroups: string[]; insufficientGroups: { name: string; required: number; selected: number }[] } => {
    const groups = getGroupsForItem(menuItemId);
    const missingGroups: string[] = [];
    const insufficientGroups: { name: string; required: number; selected: number }[] = [];
    
    groups.forEach(group => {
      const minSelections = (group as any).minSelections || 0;
      const allowQuantity = (group as any).allowQuantity;
      
      if (allowQuantity) {
        const groupQuantities = tempOptionGroupQuantities[group.id] || {};
        const totalQty = Object.values(groupQuantities).reduce((sum, q) => sum + q, 0);
        
        if (group.isRequired && totalQty === 0) {
          missingGroups.push(group.headline);
        } else if (minSelections > 0 && totalQty < minSelections) {
          insufficientGroups.push({
            name: group.headline,
            required: minSelections,
            selected: totalQty
          });
        }
      } else {
        const selections = tempOptionGroupSelections[group.id] || [];
        
        if (group.isRequired && selections.length === 0) {
          missingGroups.push(group.headline);
        } else if (minSelections > 0 && selections.length < minSelections) {
          insufficientGroups.push({
            name: group.headline,
            required: minSelections,
            selected: selections.length
          });
        }
      }
    });
    
    const allValid = missingGroups.length === 0 && insufficientGroups.length === 0;
    return { valid: allValid, missingGroups, insufficientGroups };
  };

  // Calculate total price for option group selections
  const getOptionGroupsPrice = (menuItemId: string): number => {
    const groups = getGroupsForItem(menuItemId);
    let total = 0;
    
    groups.forEach(group => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = tempOptionGroupQuantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find(o => o.id === optionId);
          if (option && qty > 0) {
            total += Number(option.price) * qty;
          }
        });
      } else {
        const selections = tempOptionGroupSelections[group.id] || [];
        selections.forEach(optionId => {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            total += Number(option.price);
          }
        });
      }
    });
    
    return total;
  };

  // Fetch hero images for this restaurant
  const { data: heroImages = [] } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images", restaurant?.id],
    queryFn: () => getHeroImages(restaurant?.id!),
    enabled: !!restaurant?.id,
  });

  // Filter to only active hero images
  const activeHeroImages = heroImages.filter(img => img.isActive !== false);

  // Dasi Food Hub slider images - must be after heroImages is declared
  const dasiSliderImages = dasiRestaurantSliderImages && dasiRestaurantSliderImages.length > 0
    ? dasiRestaurantSliderImages
    : heroImages.length > 0 
      ? heroImages.map((h) => h.imageUrl).filter(Boolean)
      : [];

  // Dasi slider auto-advance - must be after dasiSliderImages is declared
  useEffect(() => {
    if (restaurant?.slug === "dasi-food-hub" && dasiBackgroundType === "slider" && !dasiHeroVideo && !dasiHeroGif && dasiSliderImages.length > 1) {
      const timer = setInterval(() => {
        setDasiSlideIndex((prev) => (prev + 1) % dasiSliderImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [restaurant?.slug, dasiBackgroundType, dasiHeroVideo, dasiHeroGif, dasiSliderImages.length]);

  // Default DHABA hero images (fallback)
  const defaultDhabaImages = [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800",
  ];
  
  // Use hero images from database if available, otherwise use defaults
  const dhabaHeroImages = isDhabaTheme && activeHeroImages.length > 0 
    ? activeHeroImages.map(img => img.imageUrl) 
    : defaultDhabaImages;
  
  useEffect(() => {
    if (!isDhabaTheme || dhabaHeroImages.length === 0) return;
    const interval = setInterval(() => {
      setDhabaHeroIndex(prev => (prev + 1) % dhabaHeroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isDhabaTheme, dhabaHeroImages.length]);

  const createOrderMutation = useMutation({
    mutationFn: ({ order, items }: { order: any; items: any[] }) => createOrder(order, items),
    onSuccess: async (data) => {
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setCart([]);
      setAddCutlery(false);
      setActiveOrder(data);
      setShowOrderTracking(true);
      toast({
        title: "Order Placed!",
        description: "Your order has been sent to the kitchen. Track your order status below.",
        duration: 5000,
      });
      
      // Subscribe to push notifications for order tracking (for delivery orders)
      if (data.type === 'delivery' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          // Use existing service worker registration
          const registration = await navigator.serviceWorker.ready;
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const vapidRes = await fetch('/api/push/vapid-public-key');
            if (vapidRes.ok) {
              const { publicKey } = await vapidRes.json();
              // Check for existing subscription first
              let subscription = await registration.pushManager.getSubscription();
              if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: publicKey,
                });
              }
              await fetch(`/api/orders/${data.id}/push-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
              });
            }
          }
        } catch (e) {
          console.log('Push notification setup failed:', e);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Shop Closed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => createBooking(bookingData),
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your table reservation has been submitted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Poll for order updates when tracking an active order - use enhanced tracking API
  const { data: trackedData } = useQuery({
    queryKey: ["/api/track", activeOrder?.id],
    queryFn: async () => {
      if (!activeOrder?.id) return null;
      const res = await fetch(`/api/track/${activeOrder.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!activeOrder?.id && showOrderTracking,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
  });
  
  // Update activeOrder and tracking data when polled data changes
  useEffect(() => {
    if (trackedData?.order) {
      setActiveOrder((prev: any) => ({ ...prev, ...trackedData.order }));
      setTrackingData({
        delivery: trackedData.delivery,
        driver: trackedData.driver,
        driverLocation: trackedData.driverLocation,
        restaurant: trackedData.restaurant,
      });
      
      // Show notification for important status changes
      if (trackedData.delivery?.status === 'picked_up' && trackingData?.delivery?.status !== 'picked_up') {
        toast({
          title: "Order Ready!",
          description: "Your order is ready in the kitchen and will be delivered soon!",
          duration: 8000,
        });
      }
      if (trackedData.delivery?.status === 'delivering' && trackingData?.delivery?.status !== 'delivering') {
        toast({
          title: "Order On The Way!",
          description: `${trackedData.driver?.name || 'Driver'} is bringing your order!`,
          duration: 8000,
        });
      }
    }
  }, [trackedData, toast]);

  const addToCart = (item: MenuItemType) => {
    // Check if online ordering is enabled for this branch
    if (!canAddToCart()) return;
    
    // Block unavailable items
    if (item.available === false) {
      toast({
        title: "Sold Out",
        description: `${item.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if item has option groups attached
    const itemGroups = getGroupsForItem(item.id);
    if (itemGroups.length > 0) {
      // Reset selections and quantities, then show option group dialog
      setTempOptionGroupSelections({});
      setTempOptionGroupQuantities({});
      setPendingVariant(null); // Clear any pending variant
      setItemWithOptionsDialog(item);
      return;
    }
    
    // No option groups - add directly to cart
    const uniqueId = `${item.id}-${Date.now()}`;
    const newCartItem = { id: uniqueId, name: item.name, description: item.description || '', price: Number(item.price), quantity: 1, removedIngredients: [], extras: [], image: item.image || '', optionGroups: [] };
    setCart(prev => [...prev, newCartItem]);
    
    // If there are extras available, show extras dialog
    if (activeToppings.length > 0) {
      setTempSelectedExtras([]);
      setAddingExtrasToItem(newCartItem);
    }
  };
  
  // Add variant to cart - checks for option groups first
  const addVariantToCart = (item: MenuItemType, variant: { id: string; name: string; price: string }) => {
    // Check if online ordering is enabled for this branch
    if (!canAddToCart()) return;
    
    // Block unavailable items
    if (item.available === false) {
      toast({
        title: "Sold Out",
        description: `${item.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }
    
    const variantName = `${item.name} - ${variant.name}`;
    const variantPrice = Number(variant.price);
    
    // Check if item has option groups attached
    const itemGroups = getGroupsForItem(item.id);
    if (itemGroups.length > 0) {
      // Store variant info and show option group dialog
      setTempOptionGroupSelections({});
      setTempOptionGroupQuantities({});
      setPendingVariant({ variantId: variant.id, variantName: variantName, variantPrice: variantPrice });
      setItemWithOptionsDialog(item);
      return;
    }
    
    // No option groups - add variant directly to cart
    const uniqueId = `${item.id}-${variant.id}-${Date.now()}`;
    const newCartItem = { 
      id: uniqueId, 
      name: variantName, 
      description: item.description || '', 
      price: variantPrice, 
      quantity: 1, 
      removedIngredients: [], 
      extras: [], 
      image: item.image || '', 
      optionGroups: [] 
    };
    setCart(prev => [...prev, newCartItem]);
    
    // If there are extras available, show extras dialog
    if (activeToppings.length > 0) {
      setTempSelectedExtras([]);
      setAddingExtrasToItem(newCartItem);
    }
  };
  
  // Add to cart with option group selections
  const addToCartWithOptions = (item: MenuItemType) => {
    // Check if online ordering is enabled for this branch
    if (!canAddToCart()) return;
    
    const itemGroups = getGroupsForItem(item.id);
    
    // Validate required groups (supports both selections and quantities)
    const validation = validateOptionGroupsUtil(itemGroups, tempOptionGroupSelections, tempOptionGroupQuantities);
    if (!validation.valid) {
      let errorMsg = "";
      if (validation.missingGroups.length > 0) {
        errorMsg = `Please select: ${validation.missingGroups.join(", ")}`;
      }
      if (validation.insufficientGroups && validation.insufficientGroups.length > 0) {
        const insufficientMsgs = validation.insufficientGroups.map(g => 
          `${g.name}: select ${g.required - g.selected} more (${g.selected}/${g.required})`
        );
        if (errorMsg) errorMsg += ". ";
        errorMsg += insufficientMsgs.join(", ");
      }
      toast({
        title: "Selection Required",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }
    
    // Build option group selections for cart (supports both selections and quantities)
    const optionGroupData = buildOptionGroupSelections(itemGroups, tempOptionGroupSelections, tempOptionGroupQuantities);
    
    // Use variant info if available, otherwise use item's base price and name
    const itemName = pendingVariant ? pendingVariant.variantName : item.name;
    const itemPrice = pendingVariant ? pendingVariant.variantPrice : Number(item.price);
    const uniqueId = pendingVariant 
      ? `${item.id}-${pendingVariant.variantId}-${Date.now()}`
      : `${item.id}-${Date.now()}`;
    
    const newCartItem = { 
      id: uniqueId, 
      name: itemName, 
      description: item.description || '', 
      price: itemPrice, 
      quantity: 1, 
      removedIngredients: [], 
      extras: [], 
      image: item.image || '',
      optionGroups: optionGroupData,
    };
    setCart(prev => [...prev, newCartItem]);
    
    setItemWithOptionsDialog(null);
    setTempOptionGroupQuantities({});
    setTempOptionGroupSelections({});
    setPendingVariant(null); // Clear pending variant
    
    // If there are extras available, show extras dialog
    if (activeToppings.length > 0) {
      setTempSelectedExtras([]);
      setAddingExtrasToItem(newCartItem);
    }
  };
  
  const getItemTotalPrice = (item: CartItem) => {
    const baseTotal = item.price * item.quantity;
    const extrasPerUnit = item.extras.reduce((sum, extraName) => {
      const topping = activeToppings.find(t => t.name === extraName);
      return sum + (topping ? Number(topping.price) : 0);
    }, 0);
    // Add option group selections price (supports both regular selection and quantity-based)
    const optionGroupsPerUnit = (item.optionGroups || []).reduce((sum, group) => {
      return sum + group.selectedOptions.reduce((optSum, opt) => {
        const qty = (opt as any).quantity || 1;
        return optSum + (opt.price * qty);
      }, 0);
    }, 0);
    return baseTotal + (extrasPerUnit * item.quantity) + (optionGroupsPerUnit * item.quantity);
  };

  const calculateFinalTotal = (subtotal: number, type: string) => {
    if (!restaurant) return subtotal;
    let total = subtotal;
    if (addCutlery && restaurant.cutleryOptionEnabled) {
      total += Number((restaurant as any).cutleryPrice || 0.50);
    }
    if (restaurant.serviceFeeEnabled) {
      total += subtotal * Number(restaurant.serviceFeePercent || 0) / 100;
    }
    if (restaurant.vatEnabled) {
      total += subtotal * Number(restaurant.vatPercent || 0) / 100;
    }
    if (type === "delivery" && restaurant.deliveryFeeEnabled) {
      const freeDeliveryThreshold = Number(restaurant.freeDeliveryMinimum || 0);
      if (!restaurant.freeDeliveryEnabled || subtotal < freeDeliveryThreshold) {
        total += Number(restaurant.deliveryFee || 0);
      }
    }
    if (type === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && subtotal >= Number(restaurant.collectionDiscountMinimum || 15)) {
      total -= subtotal * (restaurant.collectionDiscountPercent / 100);
    }
    return total;
  };

  const checkoutFormDataRef = useRef<{ customerName: string; customerPhone: string; deliveryAddress: string; customerAddress: string; customerPostcode: string }>({ customerName: '', customerPhone: '', deliveryAddress: '', customerAddress: '', customerPostcode: '' });

  // Haversine distance calculation between two GPS coordinates (returns miles)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Validate UK postcode format
  const isUKPostcode = (address: string): boolean => {
    const ukPostcodeRegex = /\b[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}\b/i;
    return ukPostcodeRegex.test(address);
  };

  // Geocode UK postcode using postcodes.io API
  const geocodePostcode = async (postcode: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.status === 200 && data.result) {
        return { lat: data.result.latitude, lng: data.result.longitude };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Extract postcode from address string
  const extractPostcode = (address: string): string | null => {
    const ukPostcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2})\b/i;
    const match = address.match(ukPostcodeRegex);
    return match ? match[1] : null;
  };

  // Validate delivery area based on restaurant settings
  const validateDeliveryArea = async (address: string): Promise<{ valid: boolean; error?: string }> => {
    if (!restaurant) return { valid: true };
    
    const radiusType = restaurant.deliveryRadiusType || "uk_only";
    const radiusMiles = Number(restaurant.deliveryRadiusMiles) || 5;
    const restaurantLat = Number((restaurant as any).restaurantLatitude || 0);
    const restaurantLng = Number((restaurant as any).restaurantLongitude || 0);

    // Combine address with postcode from form
    const fullAddress = checkoutFormDataRef.current.customerPostcode 
      ? `${address} ${checkoutFormDataRef.current.customerPostcode}`
      : address;

    if (radiusType === "worldwide") {
      return { valid: true };
    }

    if (radiusType === "uk_only") {
      if (!isUKPostcode(fullAddress)) {
        return { valid: false, error: "Sorry, we only deliver to UK addresses. Please include a valid UK postcode." };
      }
      return { valid: true };
    }

    if (radiusType === "radius") {
      const postcode = extractPostcode(fullAddress);
      if (!postcode) {
        return { valid: false, error: `Sorry, we only deliver within ${radiusMiles} miles. Please enter a valid UK postcode.` };
      }

      if (!restaurantLat || !restaurantLng) {
        if (!isUKPostcode(fullAddress)) {
          return { valid: false, error: "Please enter a valid UK postcode for delivery." };
        }
        return { valid: true };
      }
      
      const coords = await geocodePostcode(postcode);
      if (!coords) {
        return { valid: false, error: "Could not verify your postcode. Please check it's correct." };
      }

      const distance = calculateDistance(restaurantLat, restaurantLng, coords.lat, coords.lng);
      if (distance > radiusMiles) {
        return { valid: false, error: `Sorry, your address is ${distance.toFixed(1)} miles away. We only deliver within ${radiusMiles} miles.` };
      }

      return { valid: true };
    }

    return { valid: true };
  };

  const validateCheckoutForm = () => {
    const customerName = checkoutFormDataRef.current.customerName.trim();
    const customerPhone = checkoutFormDataRef.current.customerPhone.trim();
    const deliveryAddress = checkoutFormDataRef.current.deliveryAddress || checkoutFormDataRef.current.customerAddress;
    const postcode = checkoutFormDataRef.current.customerPostcode;
    
    if (!customerName) {
      return { isValid: false, error: "Please enter your name" };
    }
    if (!customerPhone) {
      return { isValid: false, error: "Please enter your phone number" };
    }
    
    if (orderType === "delivery") {
      if (!deliveryAddress || deliveryAddress.trim() === '') {
        return { isValid: false, error: "Please enter your delivery address" };
      }
      
      const radiusType = restaurant?.deliveryRadiusType || "uk_only";
      if (radiusType === "uk_only" || radiusType === "radius") {
        const fullAddress = postcode ? `${deliveryAddress} ${postcode}` : deliveryAddress;
        if (!isUKPostcode(fullAddress)) {
          return { isValid: false, error: "Please enter a valid UK postcode for delivery" };
        }
      }
    }
    return { isValid: true };
  };

  // Wrapper for async delivery validation (used by CardPaymentForm)
  const validateDeliveryForCard = async (): Promise<{ valid: boolean; error?: string }> => {
    if (orderType !== "delivery") {
      return { valid: true };
    }
    const deliveryAddress = checkoutFormDataRef.current.deliveryAddress || checkoutFormDataRef.current.customerAddress;
    if (!deliveryAddress) {
      return { valid: true };
    }
    const result = await validateDeliveryArea(deliveryAddress);
    if (!result.valid) {
      setDeliveryAreaError(result.error || "Delivery not available to this address");
    } else {
      setDeliveryAreaError(null);
    }
    return result;
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    // Get form data from ref (works for both real forms and programmatic calls)
    const customerName = checkoutFormDataRef.current.customerName;
    const customerPhone = checkoutFormDataRef.current.customerPhone;
    const deliveryAddress = checkoutFormDataRef.current.deliveryAddress || checkoutFormDataRef.current.customerAddress;

    const scrollToAndHighlight = (id: string) => {
      const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        el.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => el.classList.remove('ring-2', 'ring-red-500'), 3000);
      }
    };
    if (!customerName || customerName.trim() === '') {
      toast({
        title: "Name Required",
        description: "Please enter your name to place the order.",
        variant: "destructive",
      });
      scrollToAndHighlight('customerName');
      scrollToAndHighlight('customerNameDefaultCard');
      return;
    }
    if (!customerPhone || customerPhone.trim() === '') {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to place the order.",
        variant: "destructive",
      });
      scrollToAndHighlight('customerPhone');
      scrollToAndHighlight('customerPhoneDefaultCard');
      return;
    }
    if (orderType === "delivery" && (!deliveryAddress || deliveryAddress.trim() === '')) {
      toast({
        title: "Address Required",
        description: "Please enter your delivery address.",
        variant: "destructive",
      });
      scrollToAndHighlight('deliveryAddress');
      scrollToAndHighlight('deliveryAddressDefaultCard');
      return;
    }

    // Validate delivery area
    if (orderType === "delivery" && deliveryAddress) {
      validateDeliveryArea(deliveryAddress).then(result => {
        if (!result.valid) {
          setDeliveryAreaError(result.error || "Delivery not available to this address");
          toast({
            title: "Delivery Area Restricted",
            description: result.error || "Sorry, we cannot deliver to this address.",
            variant: "destructive",
          });
          return;
        }
        setDeliveryAreaError(null);
        proceedWithOrder(customerName, customerPhone, deliveryAddress);
      });
      return;
    }

    proceedWithOrder(customerName, customerPhone, deliveryAddress);
  };

  const proceedWithOrder = (customerName: string, customerPhone: string, deliveryAddress: string | null) => {
    if (!restaurant?.id) return;

    const orderItems = cart.map(item => {
      let notes = item.description || '';
      if (item.extras.length > 0) {
        notes = notes ? `${notes} | EXTRA: ${item.extras.join(', ')}` : `EXTRA: ${item.extras.join(', ')}`;
      }
      if (item.removedIngredients.length > 0) {
        notes = notes ? `${notes} | NO: ${item.removedIngredients.join(', ')}` : `NO: ${item.removedIngredients.join(', ')}`;
      }
      // Add option group selections to notes
      if (item.optionGroups && item.optionGroups.length > 0) {
        item.optionGroups.forEach(group => {
          if (group.selectedOptions.length > 0) {
            const optionNames = group.selectedOptions.map(o => o.name).join(', ');
            notes = notes ? `${notes} | ${group.groupHeadline}: ${optionNames}` : `${group.groupHeadline}: ${optionNames}`;
          }
        });
      }
      const extrasPerUnit = item.extras.reduce((sum, extraName) => {
        const topping = activeToppings.find(t => t.name === extraName);
        return sum + (topping ? Number(topping.price) : 0);
      }, 0);
      const optionGroupsPerUnit = (item.optionGroups || []).reduce((sum, group) => {
        return sum + group.selectedOptions.reduce((optSum, opt) => optSum + opt.price, 0);
      }, 0);
      const unitPrice = item.price + extrasPerUnit + optionGroupsPerUnit;
      return {
        name: item.name,
        quantity: item.quantity,
        price: unitPrice.toFixed(2),
        notes: notes || null,
      };
    });

    if (addCutlery && restaurant?.cutleryOptionEnabled) {
      orderItems.push({ name: (restaurant as any).cutleryName || "Cutlery Set", quantity: 1, price: Number((restaurant as any).cutleryPrice || 0.50).toFixed(2), notes: null });
    }

    const finalTotal = calculateFinalTotal(cartTotal, orderType);

    createOrderMutation.mutate({
      order: {
        restaurantId: restaurant.id,
        customerName: customerName,
        phone: customerPhone,
        address: orderType === "delivery" ? deliveryAddress : null,
        type: orderType,
        total: finalTotal.toFixed(2),
        status: "new",
        paymentMethod: paymentMethod === "bank_transfer" ? "bank_transfer" : "cash",
        notes: specialInstructions || null,
      },
      items: orderItems,
    });
  };

  const handleCardPaymentSuccess = (paymentIntentId: string) => {
    if (!restaurant?.id) return;

    const orderItems = cart.map(item => {
      let notes = item.description || '';
      if (item.extras.length > 0) {
        notes = notes ? `${notes} | EXTRA: ${item.extras.join(', ')}` : `EXTRA: ${item.extras.join(', ')}`;
      }
      if (item.removedIngredients.length > 0) {
        notes = notes ? `${notes} | NO: ${item.removedIngredients.join(', ')}` : `NO: ${item.removedIngredients.join(', ')}`;
      }
      // Add option group selections to notes
      if (item.optionGroups && item.optionGroups.length > 0) {
        item.optionGroups.forEach(group => {
          if (group.selectedOptions.length > 0) {
            const optionNames = group.selectedOptions.map(o => o.name).join(', ');
            notes = notes ? `${notes} | ${group.groupHeadline}: ${optionNames}` : `${group.groupHeadline}: ${optionNames}`;
          }
        });
      }
      const extrasPerUnit = item.extras.reduce((sum, extraName) => {
        const topping = activeToppings.find(t => t.name === extraName);
        return sum + (topping ? Number(topping.price) : 0);
      }, 0);
      const optionGroupsPerUnit = (item.optionGroups || []).reduce((sum, group) => {
        return sum + group.selectedOptions.reduce((optSum, opt) => optSum + opt.price, 0);
      }, 0);
      const unitPrice = item.price + extrasPerUnit + optionGroupsPerUnit;
      return {
        name: item.name,
        quantity: item.quantity,
        price: unitPrice.toFixed(2),
        notes: notes || null,
      };
    });

    if (addCutlery && restaurant?.cutleryOptionEnabled) {
      orderItems.push({ name: (restaurant as any).cutleryName || "Cutlery Set", quantity: 1, price: Number((restaurant as any).cutleryPrice || 0.50).toFixed(2), notes: null });
    }

    const finalTotal = calculateFinalTotal(cartTotal, orderType);

    createOrderMutation.mutate({
      order: {
        restaurantId: restaurant.id,
        customerName: checkoutFormDataRef.current.customerName,
        phone: checkoutFormDataRef.current.customerPhone,
        address: orderType === "delivery" ? checkoutFormDataRef.current.deliveryAddress : null,
        type: orderType,
        total: finalTotal.toFixed(2),
        status: "new",
        paymentMethod: "card",
        stripePaymentId: paymentIntentId,
        notes: specialInstructions || null,
      },
      items: orderItems,
    });
    setIsProcessingPayment(false);
  };

  const handleCardPaymentError = (error: string) => {
    const friendlyMsg = error.includes('currency') || error.includes('Invalid') || error.includes('Stripe') || error.includes('configured')
      ? "Card payment is temporarily unavailable. Please try cash or bank transfer."
      : error.includes('declined') ? "Your card was declined. Please try a different card."
      : error.includes('expired') ? "Your card has expired. Please use a different card."
      : error.includes('insufficient') ? "Insufficient funds. Please try a different card."
      : "Payment could not be processed. Please try again or use a different payment method.";
    setCardError(friendlyMsg);
    toast({
      title: "Payment Issue",
      description: friendlyMsg,
      variant: "destructive",
    });
    setIsProcessingPayment(false);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const scrollToCategory = (categoryId: string) => {
    if (!expandedCategories.includes(categoryId)) {
      setExpandedCategories(prev => [...prev, categoryId]);
    }
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const cartTotal = cart.reduce((acc, item) => acc + getItemTotalPrice(item), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getItemsByCategory = (categoryId: string): MenuItemWithVariants[] => {
    // Find the category to get its slug for matching
    const category = dynamicCategories.find(c => c.id === categoryId);
    const categorySlug = category?.slug || categoryId;
    
    return menuItemsWithVariants.filter(item => {
      // Match by either category ID, slug, or categorySlug field on the item
      const matches = item.category === categoryId || 
                      item.category === categorySlug || 
                      (item as any).categorySlug === categorySlug ||
                      (item as any).categorySlug === categoryId;
      if (searchQuery) {
        return matches && item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return matches;
    });
  };

  const getItemsWithVariantsByCategory = getItemsByCategory;

  // Show ALL categories, including empty ones (no filtering by items)
  const availableCategories = dynamicCategories;

  // Dixy sliding pages: switch to category with animation
  const switchToCategory = (categoryId: string) => {
    if (categoryId === activeCategoryId) return;
    
    const currentIndex = availableCategories.findIndex(c => c.id === activeCategoryId);
    const newIndex = availableCategories.findIndex(c => c.id === categoryId);
    
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
    setActiveCategoryId(categoryId);
  };

  // Initialize active category for Dixy sliding pages
  useEffect(() => {
    if (isDixyTheme && availableCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(availableCategories[0].id);
    }
  }, [isDixyTheme, availableCategories, activeCategoryId]);

  // Intersection Observer for Dixy scroll sync - auto-scrolls sidebar when scrolling menu
  useEffect(() => {
    if (!isDixyTheme || availableCategories.length === 0) return;

    let observer: IntersectionObserver | null = null;

    // Wait for DOM to be ready
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
      };

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id.replace('dixy-category-', '');
            setActiveCategoryId(categoryId);
            
            // Auto-scroll the sidebar to show the active category button
            if (sidebarRef.current) {
              const sidebarButton = sidebarRef.current.querySelector(`[data-testid="sidebar-category-${categoryId}"]`);
              if (sidebarButton) {
                sidebarButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }
        });
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);

      availableCategories.forEach(category => {
        const element = document.getElementById(`dixy-category-${category.id}`);
        if (element && observer) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [isDixyTheme, availableCategories]);

  // Tawa hero slider auto-advance
  useEffect(() => {
    if (!isTawaTheme && !isTawaWatfordTheme) return;
    const slideCount = isTawaWatfordTheme ? 4 : TAWA_HERO_IMAGES.length;
    const interval = setInterval(() => {
      setTawaSliderIndex((prev) => (prev + 1) % slideCount);
    }, 4000);
    return () => clearInterval(interval);
  }, [isTawaTheme, isTawaWatfordTheme, TAWA_HERO_IMAGES.length]);

  // Initialize active category for Tawa theme
  useEffect(() => {
    if ((isTawaTheme || isTawaWatfordTheme) && availableCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(availableCategories[0].id);
    }
  }, [isTawaTheme, isTawaWatfordTheme, availableCategories, activeCategoryId]);

  if (loadingRestaurant || loadingMenuWithVariants) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f0f17 0%, #1a1a2e 50%, #0f0f17 100%)' }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-white/70 mt-6 text-lg font-medium">Loading menu...</p>
          <p className="text-white/40 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-gray-500">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isAcceptingOrders = restaurant?.acceptingOrders ?? true;

  return (
    <div 
      className={`min-h-screen ${isDhabaTheme ? 'pb-0' : 'pb-24'} ${isRoyalTheme ? 'text-white relative' : isDixyTheme ? 'text-white relative' : isTawaWatfordTheme ? 'text-white relative' : isTawaTheme ? 'text-gray-900 relative' : isEmparoTheme ? 'text-white relative' : isDhabaTheme ? 'text-white' : isSpicyTheme ? 'text-white relative' : isBurgerTheme ? 'text-white relative' : isHelloMumbaiTheme ? 'text-white relative' : isMujeebSweetsTheme ? 'text-white relative' : hasGenericTheme ? 'relative' : 'bg-slate-900 text-white font-sans'}`}
      style={isRoyalTheme ? { 
        background: AFGHAN_ROYAL_THEME.gradient.background,
        fontFamily: "'Georgia', 'Times New Roman', serif"
      } : isDixyTheme ? {
        background: DIXY_PREMIUM_THEME.gradient.background,
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isTawaWatfordTheme ? {
        background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 50%, #0f1c2e 100%)',
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isTawaTheme ? {
        background: 'linear-gradient(180deg, #1f2937 0%, #111827 5%, #faf5f0 10%, #fdf8f3 50%, #f5ebe0 100%)',
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isEmparoTheme ? {
        background: '#0d1b2a',
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isDhabaTheme ? {
        background: DHABA_THEME.primary,
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isSpicyTheme ? {
        background: SPICY_THEME.gradient.hero,
        fontFamily: "'Bebas Neue', 'Poppins', sans-serif"
      } : isBurgerTheme ? {
        background: '#1a1a1a',
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : isHelloMumbaiTheme ? {
        background: '#000000',
        fontFamily: "'Poppins', 'Arial', sans-serif"
      } : hasGenericTheme ? {
        background: genericTheme.colors.background,
        fontFamily: genericTheme.fontFamily,
        color: genericTheme.colors.text
      } : {}}
    >
      {/* Orders Paused Banner */}
      {!isAcceptingOrders && (
        <div className={isRoyalTheme ? "bg-gradient-to-r from-red-900 via-red-700 to-red-900 text-white py-4 px-4" : "bg-red-600 text-white py-4 px-4"}>
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <X className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">Not Accepting Orders</p>
              <p className="text-sm text-red-100">We're currently closed. Please check back later!</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Navigation Bar - Hidden for Tawa, Tawa Watford, Emparo, Dhaba, Spicy, Burger, Maharaj, Hello Mumbai, Mujeeb Sweets, Shirin Mahal, and Dasi Food Hub themes which have their own headers */}
      {!isTawaTheme && !isTawaWatfordTheme && !isEmparoTheme && !isDhabaTheme && !isSpicyTheme && !isBurgerTheme && !isMaharajTheme && !isHelloMumbaiTheme && !isMujeebSweetsTheme && !isShirinMahalTheme && !isDasiFoodHubTheme && (
      <nav 
        className={isRoyalTheme ? "border-b border-yellow-600/30 sticky top-0 z-50 backdrop-blur-xl" : isDixyTheme ? "nav-premium sticky top-0 z-50" : hasGenericTheme ? "sticky top-0 z-50 border-b" : "bg-white border-b border-gray-100"}
        style={isRoyalTheme ? { background: 'linear-gradient(180deg, rgba(26, 16, 64, 0.98) 0%, rgba(45, 27, 105, 0.95) 100%)' } : isDixyTheme ? { background: DIXY_PREMIUM_THEME.gradient.header } : hasGenericTheme ? { background: genericTheme.colors.primary, borderColor: genericTheme.colors.accent } : {}}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { playClick(); navigate(welcomeUrl); }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-2 transition-all text-sm font-medium ${isRoyalTheme ? 'text-yellow-300 hover:text-yellow-200' : isDixyTheme ? 'text-white hover:text-yellow-300 hover:-translate-y-0.5' : hasGenericTheme ? '' : 'text-gray-500 hover:text-gray-900'}`}
              style={hasGenericTheme ? { color: genericTheme.colors.text } : {}}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK
            </button>
            {isDixyTheme && (
              <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={restaurant.logoUrl || "https://dixywalsall.co.uk/site-assets/img/logo/logo.png"} 
                alt={restaurant.name}
                className="h-10 object-contain drop-shadow-lg"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { playClick(); openBooking(); }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isRoyalTheme ? 'border border-yellow-500/50 bg-purple-900/50 hover:bg-purple-800/60 text-yellow-200' : isDixyTheme ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 hover:-translate-y-0.5 hover:shadow-lg' : 'border border-gray-200 hover:bg-gray-50'}`}
              data-testid="button-booking"
            >
              <Calendar className={`h-5 w-5 ${isRoyalTheme ? 'text-yellow-300' : isDixyTheme ? 'text-white' : 'text-gray-600'}`} />
              <span className={`font-medium hidden sm:inline ${isRoyalTheme ? 'text-yellow-200' : isDixyTheme ? 'text-white' : 'text-gray-700'}`}>Booking</span>
            </button>
            <button 
              onClick={() => { playClick(); setShowLogin(true); }}
              onMouseEnter={() => playHover()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isRoyalTheme ? 'border border-yellow-500/50 bg-purple-900/50 hover:bg-purple-800/60 text-yellow-200' : isDixyTheme ? 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20 hover:-translate-y-0.5 hover:shadow-lg' : 'border border-gray-200 hover:bg-gray-50'}`}
              data-testid="button-login"
            >
              <User className={`h-5 w-5 ${isRoyalTheme ? 'text-yellow-300' : isDixyTheme ? 'text-white' : 'text-gray-600'}`} />
              <span className={`font-medium hidden sm:inline ${isRoyalTheme ? 'text-yellow-200' : isDixyTheme ? 'text-white' : 'text-gray-700'}`}>{currentCustomer ? currentCustomer.name || "Account" : "Log In"}</span>
              {!isDixyTheme && <ChevronRight className={`h-4 w-4 ${isRoyalTheme ? 'text-yellow-400' : 'text-gray-400'}`} />}
            </button>
            {/* Dixy Mobile Hamburger Menu Button */}
            {isDixyTheme && (
              <button 
                onClick={() => { playClick(); setDixyMobileMenuOpen(true); }}
                className="md:hidden w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/20 bg-white/10 border border-white/20"
                data-testid="button-hamburger-dixy-mobile"
              >
                <div className="w-5 h-0.5 rounded-full bg-white" />
                <div className="w-5 h-0.5 rounded-full bg-white" />
                <div className="w-5 h-0.5 rounded-full bg-white" />
              </button>
            )}
            {/* Royal Mobile Hamburger Menu Button */}
            {isRoyalTheme && (
              <button 
                onClick={() => { playClick(); setRoyalMobileMenuOpen(true); }}
                className="md:hidden w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:bg-purple-800/60 bg-purple-900/50 border border-yellow-500/50"
                data-testid="button-hamburger-royal-mobile"
              >
                <div className="w-5 h-0.5 rounded-full bg-yellow-300" />
                <div className="w-5 h-0.5 rounded-full bg-yellow-300" />
                <div className="w-5 h-0.5 rounded-full bg-yellow-300" />
              </button>
            )}
          </div>
        </div>
      </nav>
      )}

      {/* DIXY Mobile Sidebar Menu */}
      {isDixyTheme && (
        <Sheet open={dixyMobileMenuOpen} onOpenChange={setDixyMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 border-r-0"
            style={{ background: DIXY_PREMIUM_THEME.gradient.sidebar }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-10 object-contain" />
                  )}
                  <h2 className="font-bold text-lg text-white">Menu</h2>
                </div>
              </div>
              
              {/* Categories List */}
              <div className="flex-1 overflow-y-auto py-2">
                <h3 className="px-4 py-2 text-xs font-bold text-white/60 uppercase tracking-widest">Categories</h3>
                {availableCategories.map((category: { id: string; name: string }) => (
                  <button
                    key={category.id}
                    onClick={() => { 
                      playClick(); 
                      setActiveCategoryId(category.id);
                      const element = document.getElementById(`dixy-category-${category.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      setDixyMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-white/10"
                    style={{
                      background: activeCategoryId === category.id ? 'rgba(227,30,36,0.2)' : 'transparent',
                      borderLeft: activeCategoryId === category.id ? `3px solid ${DIXY_PREMIUM_THEME.primary}` : '3px solid transparent',
                    }}
                    data-testid={`dixy-mobile-category-${category.id}`}
                  >
                    <span 
                      className="text-sm font-medium"
                      style={{ color: activeCategoryId === category.id ? DIXY_PREMIUM_THEME.secondary : 'rgba(255,255,255,0.8)' }}
                    >
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Sidebar Footer Actions */}
              <div className="p-4 border-t border-white/10 space-y-2">
                <button 
                  onClick={() => { playClick(); setShowAllergenMatrix(true); setDixyMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" style={{ color: DIXY_PREMIUM_THEME.secondary }} />
                  View Allergens
                </button>
                <button 
                  onClick={() => { playClick(); setShowLogin(true); setDixyMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <User className="h-4 w-4" style={{ color: DIXY_PREMIUM_THEME.secondary }} />
                  {currentCustomer ? 'My Account' : 'Log In'}
                </button>
                <button 
                  onClick={() => { playClick(); openBooking(); setDixyMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" style={{ color: DIXY_PREMIUM_THEME.secondary }} />
                  Book a Table
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ROYAL Mobile Sidebar Menu */}
      {isRoyalTheme && (
        <Sheet open={royalMobileMenuOpen} onOpenChange={setRoyalMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 border-r-0"
            style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d1f3d 50%, #3d1f2d 100%)' }}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-yellow-500/20">
                <div className="flex items-center gap-3">
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-10 object-contain" />
                  )}
                  <h2 className="font-bold text-lg text-yellow-100">Menu</h2>
                </div>
              </div>
              
              {/* Categories List */}
              <div className="flex-1 overflow-y-auto py-2">
                <h3 className="px-4 py-2 text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Categories</h3>
                {availableCategories.map((category: { id: string; name: string }) => (
                  <button
                    key={category.id}
                    onClick={() => { 
                      playClick(); 
                      const element = document.getElementById(`royal-category-${category.id}`) || document.getElementById(`category-${category.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                      setRoyalMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-purple-900/30"
                    style={{
                      borderLeft: '3px solid transparent',
                    }}
                    data-testid={`royal-mobile-category-${category.id}`}
                  >
                    <span className="text-sm font-medium text-yellow-100/80 hover:text-yellow-100">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Sidebar Footer Actions */}
              <div className="p-4 border-t border-yellow-500/20 space-y-2">
                <button 
                  onClick={() => { playClick(); setShowAllergenMatrix(true); setRoyalMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-yellow-100/80 hover:text-yellow-100 hover:bg-purple-900/30 transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  View Allergens
                </button>
                <button 
                  onClick={() => { playClick(); setShowLogin(true); setRoyalMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-yellow-100/80 hover:text-yellow-100 hover:bg-purple-900/30 transition-all flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-yellow-400" />
                  {currentCustomer ? 'My Account' : 'Log In'}
                </button>
                <button 
                  onClick={() => { playClick(); openBooking(); setRoyalMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-yellow-100/80 hover:text-yellow-100 hover:bg-purple-900/30 transition-all flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-yellow-400" />
                  Book a Table
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* MAHARAJ THEME LAYOUT - Vibrant Indian Style for Nandini's */}
      {isMaharajTheme ? (
        <div style={{ background: MAHARAJ_THEME.gradient.background, minHeight: '100vh' }}>
          {/* Maharaj Sticky Navigation with Rainbow Gradient */}
          <nav className="sticky top-0 z-50 shadow-2xl overflow-hidden">
            {/* Animated Rainbow Shimmer Bar */}
            <div 
              className="h-1.5 relative overflow-hidden"
              style={{ background: MAHARAJ_THEME.gradient.header }}
            >
              <div 
                className="absolute inset-0"
                style={{ 
                  background: MAHARAJ_THEME.gradient.shimmer,
                  backgroundSize: '200% 100%',
                  animation: 'maharaj-shimmer 3s linear infinite',
                }}
              />
            </div>
            
            <div 
              className="relative"
              style={{ 
                background: 'linear-gradient(180deg, rgba(26,10,46,0.98) 0%, rgba(45,27,78,0.95) 100%)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Logo Section with Back Button */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(welcomeUrl)}
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                      data-testid="button-back-to-welcome-maharaj"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    {restaurant.logoUrl && (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md" style={{ background: MAHARAJ_THEME.gradient.hero, opacity: 0.5 }} />
                        <img src={restaurant.logoUrl} alt={restaurant.name} className="relative h-12 md:h-14 object-contain drop-shadow-lg" />
                      </div>
                    )}
                    <div>
                      <h1 
                        className="text-xl md:text-2xl font-bold"
                        style={{ 
                          background: MAHARAJ_THEME.gradient.gold,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {restaurant.name}
                      </h1>
                    </div>
                  </div>
                  
                  {/* Desktop Navigation */}
                  <div className="hidden lg:flex items-center gap-6">
                    <button onClick={() => scrollToTop()} className="text-white/80 hover:text-white transition-all text-sm font-medium">Home</button>
                    <button onClick={() => scrollToCategory(categoriesWithItems[0]?.slug || '')} className="text-white/80 hover:text-white transition-all text-sm font-medium">Menu</button>
                    <button onClick={() => { playClick(); openBooking(); }} className="text-white/80 hover:text-white transition-all text-sm font-medium">Book Table</button>
                    <button onClick={() => { playClick(); setShowAllergenMatrix(true); }} className="text-white/80 hover:text-white transition-all text-sm font-medium">Allergens</button>
                    <button 
                      onClick={() => { playClick(); setShowLogin(true); }}
                      className="px-4 py-2 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
                      style={{ background: MAHARAJ_THEME.gradient.button }}
                    >
                      {currentCustomer ? 'My Account' : 'Log In'}
                    </button>
                  </div>
                  
                  {/* Mobile Menu Button */}
                  <div className="flex items-center gap-3 lg:hidden">
                    <button 
                      onClick={() => { playClick(); setIsCartOpen(true); }}
                      className="relative p-2 rounded-full"
                      style={{ background: MAHARAJ_THEME.gradient.button }}
                    >
                      <ShoppingBag className="h-5 w-5 text-white" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-purple-900 text-xs font-bold flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </button>
                    <Sheet open={maharajMobileMenuOpen} onOpenChange={setMaharajMobileMenuOpen}>
                      <SheetTrigger asChild>
                        <button 
                          onClick={() => setMaharajMobileMenuOpen(true)}
                          className="w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all border border-white/20 hover:bg-white/10"
                        >
                          <div className="w-5 h-0.5 rounded-full" style={{ background: MAHARAJ_THEME.primary }} />
                          <div className="w-5 h-0.5 rounded-full" style={{ background: MAHARAJ_THEME.pink }} />
                          <div className="w-5 h-0.5 rounded-full" style={{ background: MAHARAJ_THEME.teal }} />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[280px] p-0 border-r-0" style={{ background: MAHARAJ_THEME.darkBg }}>
                        <div className="flex flex-col h-full">
                          <div className="p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold" style={{ background: MAHARAJ_THEME.gradient.gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Menu</h2>
                          </div>
                          <div className="flex-1 overflow-y-auto py-2">
                            {categoriesWithItems.map((category: any) => (
                              <button
                                key={category.id}
                                onClick={() => { scrollToCategory(category.slug); setMaharajMobileMenuOpen(false); }}
                                className="w-full px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm"
                              >
                                {category.name}
                              </button>
                            ))}
                          </div>
                          <div className="p-4 border-t border-white/10 space-y-2">
                            <button onClick={() => { playClick(); openBooking(); setMaharajMobileMenuOpen(false); }} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                              <Calendar className="h-4 w-4" style={{ color: MAHARAJ_THEME.pink }} />
                              Book a Table
                            </button>
                            <button onClick={() => { playClick(); setShowLogin(true); setMaharajMobileMenuOpen(false); }} className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                              <User className="h-4 w-4" style={{ color: MAHARAJ_THEME.teal }} />
                              {currentCustomer ? 'My Account' : 'Log In'}
                            </button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Rainbow Border */}
            <div className="h-1" style={{ background: MAHARAJ_THEME.gradient.header }} />
          </nav>

          {/* Category Scroll Strip */}
          <div className="sticky top-[73px] z-40 py-3 px-4" style={{ background: 'rgba(26,10,46,0.95)', backdropFilter: 'blur(10px)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categoriesWithItems.map((category: any, index: number) => {
                  const colors = [MAHARAJ_THEME.primary, MAHARAJ_THEME.pink, MAHARAJ_THEME.purple, MAHARAJ_THEME.secondary, MAHARAJ_THEME.teal, MAHARAJ_THEME.green];
                  const color = colors[index % colors.length];
                  return (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.slug)}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${color}dd 0%, ${color}99 100%)`,
                        boxShadow: `0 4px 15px ${color}40`,
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Menu Content */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            {categoriesWithItems.map((category: any, catIndex: number) => {
              const categoryItems = menuItems.filter((item: any) => 
                item.category === category.id || 
                item.category === category.slug || 
                item.categorySlug === category.slug
              );
              
              const colors = [MAHARAJ_THEME.primary, MAHARAJ_THEME.pink, MAHARAJ_THEME.purple, MAHARAJ_THEME.secondary, MAHARAJ_THEME.teal, MAHARAJ_THEME.green];
              const accentColor = colors[catIndex % colors.length];
              
              const categoryMedia: { type: 'image' | 'gif' | 'video'; url: string }[] = [];
              if (category.imageUrl) categoryMedia.push({ type: 'image', url: category.imageUrl });
              if (category.gifUrl) categoryMedia.push({ type: 'gif', url: category.gifUrl });
              if (category.videoUrl) categoryMedia.push({ type: 'video', url: category.videoUrl });
              const hasMedia = categoryMedia.length > 0;
              
              return (
                <div key={category.id} id={`category-${category.slug}`} className="mb-10 scroll-mt-32">
                  {/* Large Category Card with Media Slider */}
                  {hasMedia && (
                    <CategoryMediaSlider 
                      media={categoryMedia} 
                      categoryName={category.name} 
                      categoryDescription={category.description}
                    />
                  )}
                  
                  {/* Category Header (shown only if no media) */}
                  {!hasMedia && (
                  <div className="flex items-center gap-3 mb-6">
                    <div 
                      className="h-1 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)` }}
                    />
                    <h3 
                      className="text-xl md:text-2xl font-bold px-4 text-white"
                    >
                      {category.name}
                    </h3>
                    <div 
                      className="h-1 flex-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor} 100%)` }}
                    />
                  </div>
                  )}
                  
                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map((item: any) => (
                      <div 
                        key={item.id}
                        className="relative group rounded-xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
                        style={{ 
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                        onClick={() => { playClick(); addToCart(item); }}
                      >
                        {/* Image, Video, or GIF */}
                        {(item.image || item.videoUrl || item.gifUrl) && (
                          <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                            {item.videoUrl ? (
                              <video 
                                src={item.videoUrl} 
                                className="w-full h-full object-cover"
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                poster={item.image}
                              />
                            ) : item.gifUrl ? (
                              <img 
                                src={item.gifUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                              />
                            ) : (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="p-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-white text-lg">{item.name}</h4>
                            <span 
                              className="font-bold text-lg flex-shrink-0"
                              style={{ color: accentColor }}
                            >
                              {currencySymbol}{Number(item.price).toFixed(2)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-white/60 text-sm mt-2 line-clamp-2">{item.description}</p>
                          )}
                          
                          {/* Add Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); playClick(); addToCart(item); }}
                            className="mt-3 w-full py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)` }}
                          >
                            Add to Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <footer className="border-t border-white/10 py-10 px-4" style={{ background: 'rgba(26,10,46,0.98)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Business Info */}
                <div className="text-center md:text-left">
                  <h3 
                    className="text-xl font-bold mb-3"
                    style={{ 
                      background: MAHARAJ_THEME.gradient.gold,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {restaurant.name}
                  </h3>
                  {restaurant.address && (
                    <p className="text-white/70 text-sm leading-relaxed">{restaurant.address}</p>
                  )}
                  {restaurant.phone && (
                    <p className="text-white/70 text-sm mt-2 flex items-center justify-center md:justify-start gap-2">
                      <Phone className="h-4 w-4" />
                      {restaurant.phone}
                    </p>
                  )}
                </div>
                
                {/* Opening Hours */}
                <div className="text-center">
                  <h4 className="text-white font-bold mb-3 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    Opening Hours
                  </h4>
                  <div className="text-white/70 text-sm space-y-1">
                    <p>Monday - Thursday: 11:00 AM - 10:00 PM</p>
                    <p>Friday - Saturday: 11:00 AM - 11:00 PM</p>
                    <p>Sunday: 12:00 PM - 9:00 PM</p>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="text-center md:text-right">
                  <h4 className="text-white font-bold mb-3">Quick Links</h4>
                  <div className="flex flex-col gap-2 items-center md:items-end">
                    <button 
                      onClick={() => scrollToTop()}
                      className="text-white/70 hover:text-amber-400 text-sm transition-colors"
                    >
                      Menu
                    </button>
                    <button 
                      onClick={() => { playClick(); openBooking(); }}
                      className="text-white/70 hover:text-amber-400 text-sm transition-colors"
                    >
                      Book a Table
                    </button>
                    <a 
                      href="/terms" 
                      className="text-white/70 hover:text-amber-400 text-sm transition-colors"
                      data-testid="link-terms-maharaj"
                    >
                      Terms & Conditions
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Copyright Bar */}
              <div className="border-t border-white/10 pt-6 text-center">
                <p className="text-white/50 text-xs">
                  © 2026 {restaurant.name}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* Fix ALL backgrounds for Maharaj theme - no white anywhere */}
          <style>{`
            html, body, #root, #root > div {
              background: #1a0a2e !important;
              background-color: #1a0a2e !important;
            }
            html {
              min-height: 100% !important;
              height: 100% !important;
            }
            body {
              min-height: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              padding-bottom: 80px !important;
            }
            #root {
              min-height: 100vh !important;
            }
            /* Cover any remaining white space at page bottom */
            body::after {
              content: '';
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: 100px;
              background: #1a0a2e;
              z-index: -1;
            }
          `}</style>

          {/* CSS Animation */}
          <style>{`
            @keyframes maharaj-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>

          {/* Floating Cart Button - Same as Tawa Style */}
          {!isCartOpen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 rounded-full shadow-2xl flex justify-between items-center px-6 transition-all hover:scale-[1.02] text-white"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
              data-testid="button-view-basket"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-9 w-9 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </div>
                <span className="font-bold text-lg">View Basket</span>
              </div>
              <span className="font-bold text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
          )}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent 
              className="w-full sm:max-w-md flex flex-col border-l-0"
              style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)' }}
            >
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                  Your Basket
                </SheetTitle>
              </SheetHeader>

              {/* Collection Discount Notice */}
              {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && (
                <div className="py-3 px-4 bg-green-500/20 border border-green-400/30 rounded-lg mt-2">
                  <p className="text-green-400 text-sm font-medium text-center">
                    ✨ {restaurant.collectionDiscountPercent}% discount over {currencySymbol}{Number(restaurant.collectionDiscountMinimum || 15).toFixed(2)} on collection
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-auto py-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/60 space-y-4">
                    <ShoppingBasket className="h-16 w-16" />
                    <p>Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const itemTotalPrice = getItemTotalPrice(item);
                      const extrasTotal = item.extras.reduce((sum, extraName) => {
                        const topping = activeToppings.find(t => t.name === extraName);
                        return sum + (topping ? Number(topping.price) : 0);
                      }, 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 rounded-xl border border-white/20"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', backdropFilter: 'blur(10px)' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/30 text-green-400 hover:bg-green-500/50 transition-all"
                                  data-testid={`increase-qty-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <span className="text-white font-bold text-sm w-7 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      setCart(prev => prev.filter(i => i.id !== item.id));
                                    } else {
                                      setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-all"
                                  data-testid={`decrease-qty-${item.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{item.name}</p>
                                {item.extras.length > 0 && (
                                  <p className="text-xs text-green-400 mt-0.5 font-medium">
                                    EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                                  </p>
                                )}
                                {item.optionGroups && item.optionGroups.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {item.optionGroups.map((group, gIdx) => (
                                      <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                        {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {item.removedIngredients.length > 0 && (
                                  <p className="text-xs text-red-400 mt-0.5 font-medium">NO: {item.removedIngredients.join(', ')}</p>
                                )}
                                <p className="text-sm text-white/60 mt-1">{currencySymbol}{Number(item.price).toFixed(2)} each</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="font-bold text-yellow-300 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Special Instructions */}
              <div className="mt-4 px-1">
                <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies, extra spicy, no onions..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  rows={2}
                  data-testid="input-special-instructions"
                />
              </div>
              
              <div className="border-t border-white/20 pt-4 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-yellow-300">{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] ${!isAcceptingOrders ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-400 hover:via-emerald-400 hover:to-green-400 text-white'}`} 
                      disabled={cart.length === 0 || !isAcceptingOrders}
                      data-testid="button-checkout"
                    >
                      {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: '#0f1419', border: '1px solid #1e2a36' }}
                  >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                      {/* Header */}
                      <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                        <CheckSquare className="h-6 w-6 text-white" />
                        <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                      </DialogHeader>
                      
                      {/* Order Type Selector */}
                      <div className="mb-4 space-y-2">
                        <Label className="text-white/80 text-sm">Order Type</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOrderType("delivery")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "delivery" 
                                ? 'border-orange-500 bg-orange-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-delivery"
                          >
                            <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType("takeaway")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "takeaway" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-collection"
                          >
                            <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                          </button>
                        </div>
                      </div>

                      {/* Estimated Delivery Time */}
                      {orderType === "delivery" && (
                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                              <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Your Name</Label>
                          <Input 
                            placeholder="Enter your full name" 
                            required 
                            className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                            data-testid="input-checkout-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Phone Number</Label>
                          <div className="flex gap-2">
                            <div className="w-16 h-10 bg-transparent border border-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                            <Input 
                              type="tel" 
                              placeholder="7XXX XXX XXX" 
                              required 
                              className="flex-1 h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                              data-testid="input-checkout-phone"
                            />
                          </div>
                        </div>
                        {orderType === "delivery" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Delivery Address</Label>
                              <Input 
                                placeholder="House number and street" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerAddress = e.target.value}
                                data-testid="input-checkout-address"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Postcode</Label>
                              <Input 
                                placeholder="E.G. WD18 0AB" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                                data-testid="input-checkout-postcode"
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Payment Method</Label>
                          <div className="flex gap-3">
                            {orderType !== "delivery" && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "cash" 
                                  ? 'border-green-500 bg-green-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-cash"
                            >
                              <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                            </button>
                            )}
                            {hasStripeKeys && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("card")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "card" 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-card"
                            >
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                            </button>
                            )}
                            {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("bank_transfer")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "bank_transfer" 
                                  ? 'border-purple-500 bg-purple-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-bank"
                            >
                              <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                            </button>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                          <div className="space-y-2">
                            {cart.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {cart.length > 3 && (
                              <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                            )}
                          </div>
                          <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Section */}
                        {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <Elements stripe={stripePromise}>
                              <WalletPaymentButton
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                currency={restaurant?.currency || 'GBP'}
                                label={restaurant?.name || 'Order Total'}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              />
                              <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-[#0f1419] px-2 text-gray-500">or pay with card</span></div>
                              </div>
                              <CardPaymentForm
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                isProcessing={isProcessingPayment}
                                setIsProcessing={setIsProcessingPayment}
                                themeStyle="dark"
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              >
                                <div></div>
                              </CardPaymentForm>
                            </Elements>
                          </div>
                        )}
                        {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <FallbackCardForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="dark"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                          </div>
                        )}
                        {paymentMethod === "card" && !stripeLoadFinished && (
                          <p className="text-sm text-gray-400">Loading card payment...</p>
                        )}

                        {paymentMethod === "bank_transfer" && (
                          <BankTransferQRSection
                            restaurant={restaurant}
                            total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                            currencySymbol={currencySymbol}
                          />
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Button */}
                    <div className="p-4 border-t border-gray-800 bg-[#0f1419]">
                      {paymentMethod === "card" ? (
                        <Button 
                          type="submit"
                          form="card-payment-form"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-pay-now"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : paymentMethod === "bank_transfer" ? (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-bank"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <Building className="mr-2 h-5 w-5" />
                          I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            formData.set('customerName', checkoutFormDataRef.current.customerName);
                            formData.set('customerPhone', checkoutFormDataRef.current.customerPhone);
                            formData.set('deliveryAddress', checkoutFormDataRef.current.customerAddress);
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CheckSquare className="mr-2 h-5 w-5" />
                          Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>

          {/* Maharaj Extras Dialog */}
          <Dialog open={showMaharajExtras} onOpenChange={(open) => { setShowMaharajExtras(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #5b21b6 100%)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#fbbf24' }} className="text-xl">Add Extras to Your Order?</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select any extras you'd like to add</p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        tempSelectedExtras.includes(topping.name)
                          ? 'border-yellow-400 bg-yellow-400/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{topping.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {tempSelectedExtras.length > 0 && (
                <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(234, 179, 8, 0.3)', background: 'rgba(234, 179, 8, 0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="font-bold" style={{ color: '#fbbf24' }}>
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowMaharajExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1"
                  style={{ borderColor: 'rgba(234, 179, 8, 0.5)', color: '#fbbf24', background: 'transparent' }}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    setShowMaharajExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 font-bold"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#ffffff' }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Option Group Selection Dialog */}
          <Dialog open={!!itemWithOptionsDialog} onOpenChange={(open) => { if (!open) { setItemWithOptionsDialog(null); setPendingVariant(null); } }}>
            <DialogContent 
              className="max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)' }}
            >
              <div className="p-5">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl font-bold text-white">Customize Your Order</DialogTitle>
                  <DialogDescription className="text-purple-200/80 text-sm">
                    {pendingVariant ? pendingVariant.variantName : itemWithOptionsDialog?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                  {itemWithOptionsDialog && (
                    <OptionGroupSelector
                      groups={getGroupsForItem(itemWithOptionsDialog.id)}
                      selections={tempOptionGroupSelections}
                      quantities={tempOptionGroupQuantities}
                      onSelectionChange={(groupId, optionIds) => {
                        setTempOptionGroupSelections(prev => ({ ...prev, [groupId]: optionIds }));
                      }}
                      onQuantityChange={(groupId, optionId, quantity) => {
                        setTempOptionGroupQuantities(prev => ({
                          ...prev,
                          [groupId]: { ...prev[groupId], [optionId]: quantity }
                        }));
                      }}
                      currencySymbol={currencySymbol}
                      themeColors={{
                        primary: "#22c55e",
                        secondary: "#16a34a",
                        selectedBg: "rgba(34,197,94,0.2)",
                        text: "#ffffff",
                      }}
                    />
                  )}
                </div>
                {/* Price Total Section */}
                <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total</span>
                    <span className="text-2xl font-bold text-green-400">
                      {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setItemWithOptionsDialog(null)}
                    className="flex-1 rounded-full py-5 font-semibold border-purple-300/30 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => itemWithOptionsDialog && addToCartWithOptions(itemWithOptionsDialog)}
                    className="flex-1 rounded-full py-5 font-semibold shadow-lg hover:shadow-xl transition-all text-white"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    data-testid="button-add-with-options"
                  >
                    Add to Basket - {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Extra Toppings Dialog */}
          <Dialog open={!!addingExtrasToItem} onOpenChange={(open) => { if (!open) setAddingExtrasToItem(null); }}>
            <DialogContent 
              className="max-w-sm rounded-2xl border-0 shadow-2xl p-0 overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)' }}
            >
              <div className="p-5">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl font-bold text-white">Add Extras</DialogTitle>
                  <DialogDescription className="text-purple-200/80 text-sm">{addingExtrasToItem?.name}</DialogDescription>
                </DialogHeader>
                <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                  <div className="space-y-2">
                    {activeToppings.map(topping => (
                      <label
                        key={topping.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          tempSelectedExtras.includes(topping.name)
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={tempSelectedExtras.includes(topping.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTempSelectedExtras(prev => [...prev, topping.name]);
                              } else {
                                setTempSelectedExtras(prev => prev.filter(name => name !== topping.name));
                              }
                            }}
                            className="border-white/40 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                          <span className="text-white font-medium">{topping.name}</span>
                        </div>
                        <span className="text-green-400 font-bold">+{currencySymbol}{Number(topping.price).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAddingExtrasToItem(null)}
                    className="flex-1 border-purple-300/30 text-white hover:bg-white/10 rounded-full py-5 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (addingExtrasToItem) {
                        setCart(prev => prev.map(item => 
                          item.id === addingExtrasToItem.id ? { ...item, extras: tempSelectedExtras } : item
                        ));
                        setAddingExtrasToItem(null);
                        const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                          const topping = activeToppings.find(t => t.name === name);
                          return sum + (topping ? Number(topping.price) : 0);
                        }, 0);
                      }
                    }}
                    className="flex-1 text-white rounded-full py-5 font-semibold"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    data-testid="button-save-extras"
                  >
                    Save Extras
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : isDhabaTheme ? (
        <div style={{ background: DHABA_THEME.primary, minHeight: '100vh' }}>
          {/* DHABA Sticky Navigation with slow left-to-right animation */}
          <nav 
            className="sticky top-0 z-50 shadow-xl overflow-hidden"
            style={{ 
              background: DHABA_THEME.primary,
            }}
          >
            {/* Animated Gold Shimmer Bar - moves left to right */}
            <div 
              className="h-1 relative overflow-hidden"
              style={{ background: DHABA_THEME.primary }}
            >
              <div 
                className="absolute inset-0"
                style={{ 
                  background: `linear-gradient(90deg, transparent 0%, ${DHABA_THEME.secondary} 20%, ${DHABA_THEME.accent} 50%, ${DHABA_THEME.secondary} 80%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'dhaba-shimmer 4s linear infinite',
                }}
              />
            </div>
            
            {/* Animated Background Gradient - slow left to right */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ 
                background: `linear-gradient(90deg, ${DHABA_THEME.primary} 0%, rgba(201,166,70,0.1) 25%, ${DHABA_THEME.primary} 50%, rgba(201,166,70,0.1) 75%, ${DHABA_THEME.primary} 100%)`,
                backgroundSize: '200% 100%',
                animation: 'dhaba-shimmer 6s linear infinite',
              }}
            />
            
            <div className="relative max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                {/* Logo Section - NOW VISIBLE ON MOBILE */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => { playClick(); navigate(welcomeUrl); }}
                    className="flex items-center gap-1 text-white/80 hover:text-yellow-300 transition-all"
                    data-testid="button-back-dhaba"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm font-medium">Back</span>
                  </button>
                  {restaurant.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="h-8 sm:h-10 md:h-12 object-contain drop-shadow-lg" />
                  )}
                  <h1 className="text-sm sm:text-lg md:text-xl font-bold text-white">{restaurant.name}</h1>
                </div>
                
                {/* Desktop Navigation Links */}
                <div className="hidden lg:flex items-center gap-6 text-sm font-bold">
                  <button onClick={() => scrollToTop()} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide">Home</button>
                  <button onClick={() => scrollToCategory(availableCategories[0]?.id || '')} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide">Menu</button>
                  <button onClick={() => { playClick(); openBooking(); }} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide" data-testid="button-booking-dhaba">Booking</button>
                  <button onClick={() => { playClick(); setShowAllergenMatrix(true); }} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide" data-testid="button-allergen-dhaba">Allergens</button>
                  <button onClick={() => document.getElementById('dhaba-footer')?.scrollIntoView({ behavior: 'smooth' })} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide" data-testid="button-about-dhaba">About Us</button>
                  <button onClick={() => { playClick(); setShowLogin(true); }} className="text-white/90 hover:text-yellow-300 transition-all py-2 border-b-2 border-transparent hover:border-yellow-400 tracking-wide" data-testid="button-login-dhaba">Log In</button>
                </div>
                
                {/* Mobile Hamburger Menu Button */}
                <div className="flex items-center gap-2 lg:hidden">
                  <button 
                    onClick={() => { playClick(); openBooking(); }}
                    className="px-2 py-1.5 text-xs font-bold text-white hover:text-yellow-300 transition-all"
                    data-testid="button-booking-dhaba-mobile"
                  >
                    📅
                  </button>
                  <button 
                    onClick={() => { playClick(); setDhabaMobileMenuOpen(true); }}
                    className="w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/10"
                    style={{ border: `1px solid ${DHABA_THEME.secondary}40` }}
                    data-testid="button-hamburger-dhaba-mobile"
                  >
                    <div className="w-5 h-0.5 rounded-full" style={{ background: DHABA_THEME.secondary }} />
                    <div className="w-5 h-0.5 rounded-full" style={{ background: DHABA_THEME.secondary }} />
                    <div className="w-5 h-0.5 rounded-full" style={{ background: DHABA_THEME.secondary }} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Gold Bottom Border */}
            <div 
              className="h-0.5"
              style={{ 
                background: 'linear-gradient(90deg, transparent, #c9a646, #f6c343, #c9a646, transparent)'
              }}
            ></div>
          </nav>

          {/* DHABA Mobile Sidebar Menu */}
          <Sheet open={dhabaMobileMenuOpen} onOpenChange={setDhabaMobileMenuOpen}>
            <SheetContent 
              side="left" 
              className="w-[280px] p-0 border-r-0"
              style={{ background: DHABA_THEME.primary }}
            >
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="p-4 border-b" style={{ borderColor: `${DHABA_THEME.secondary}30` }}>
                  <div className="flex items-center gap-3">
                    {restaurant.logoUrl && (
                      <img src={restaurant.logoUrl} alt={restaurant.name} className="h-10 object-contain" />
                    )}
                    <h2 className="font-bold text-lg" style={{ color: DHABA_THEME.secondary }}>Menu</h2>
                  </div>
                </div>
                
                {/* Categories List */}
                <div className="flex-1 overflow-y-auto py-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => { 
                        playClick(); 
                        setDhabaSelectedCategory(category.id);
                        scrollToCategory(category.id);
                        setDhabaMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-white/10"
                      style={{
                        background: dhabaSelectedCategory === category.id ? 'rgba(201,166,70,0.15)' : 'transparent',
                        borderLeft: dhabaSelectedCategory === category.id ? `3px solid ${DHABA_THEME.secondary}` : '3px solid transparent',
                      }}
                      data-testid={`mobile-category-${category.id}`}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ color: dhabaSelectedCategory === category.id ? DHABA_THEME.secondary : 'rgba(255,255,255,0.8)' }}
                      >
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
                
                {/* Sidebar Footer Actions */}
                <div className="p-4 border-t space-y-2" style={{ borderColor: `${DHABA_THEME.secondary}30` }}>
                  <button 
                    onClick={() => { playClick(); setShowAllergenMatrix(true); setDhabaMobileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" style={{ color: DHABA_THEME.secondary }} />
                    View Allergens
                  </button>
                  <button 
                    onClick={() => { playClick(); setShowLogin(true); setDhabaMobileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <User className="h-4 w-4" style={{ color: DHABA_THEME.secondary }} />
                    {currentCustomer ? 'My Account' : 'Log In'}
                  </button>
                  <button 
                    onClick={() => { document.getElementById('dhaba-footer')?.scrollIntoView({ behavior: 'smooth' }); setDhabaMobileMenuOpen(false); }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" style={{ color: DHABA_THEME.secondary }} />
                    About Us
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* DHABA Hero Section with Carousel */}
          <div className="relative w-full min-h-[420px] sm:min-h-[480px] md:min-h-[520px] overflow-hidden" style={{ background: DHABA_THEME.primary }}>
            {/* Gold diagonal stripes decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-24 sm:w-32 h-full" 
                style={{ 
                  background: `linear-gradient(135deg, ${DHABA_THEME.secondary}15 25%, transparent 25%, transparent 50%, ${DHABA_THEME.secondary}15 50%, ${DHABA_THEME.secondary}15 75%, transparent 75%)`,
                  backgroundSize: '20px 20px'
                }}
              />
              <div 
                className="absolute top-0 right-0 w-24 sm:w-32 h-full" 
                style={{ 
                  background: `linear-gradient(-135deg, ${DHABA_THEME.secondary}15 25%, transparent 25%, transparent 50%, ${DHABA_THEME.secondary}15 50%, ${DHABA_THEME.secondary}15 75%, transparent 75%)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            
            {/* Top gold accent bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full" style={{ background: DHABA_THEME.gradient.gold }} />
            
            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center gap-6 sm:gap-10">
              {/* Left - Title Section */}
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 text-center lg:text-left"
              >
                {/* Food Menu Script Title */}
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl md:text-4xl italic mb-2"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: DHABA_THEME.secondary 
                  }}
                >
                  Food Menu
                </motion.p>
                
                {/* Restaurant Name */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
                >
                  {restaurant.name}
                </motion.h1>
                
                {/* Address & Contact */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-2 text-gray-300 text-sm sm:text-base mb-6"
                >
                  {restaurant.address && (
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <MapPin className="h-4 w-4" style={{ color: DHABA_THEME.secondary }} />
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant.phone && (
                    <p className="flex items-center justify-center lg:justify-start gap-2">
                      <span style={{ color: DHABA_THEME.secondary }}>📞</span>
                      {restaurant.phone}
                    </p>
                  )}
                </motion.div>
                
                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => { playClick(); scrollToCategory(availableCategories[0]?.id || ''); }}
                  className="px-8 py-3 text-base font-bold rounded-lg transition-all shadow-xl hover:scale-105"
                  style={{
                    background: DHABA_THEME.gradient.button,
                    color: DHABA_THEME.primary
                  }}
                  data-testid="button-order-now-dhaba"
                >
                  Order Now
                </motion.button>
              </motion.div>
              
              {/* Right - Hero Image Carousel with overlapping frames */}
              <motion.div 
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 relative h-[280px] sm:h-[340px] md:h-[380px] w-full max-w-lg"
              >
                {/* Three overlapping images with animated gradient borders */}
                {dhabaHeroImages.map((img, idx) => {
                  const isActive = idx === dhabaHeroIndex;
                  const zIndex = isActive ? 30 : 20 - idx;
                  const rotation = idx === 0 ? -8 : idx === 1 ? 0 : 8;
                  const translateX = idx === 0 ? -30 : idx === 2 ? 30 : 0;
                  
                  return (
                    <motion.div
                      key={idx}
                      className="absolute top-[20%] left-1/2 w-40 sm:w-52 md:w-64 h-48 sm:h-60 md:h-72"
                      style={{
                        zIndex,
                        transform: `translate(-50%, -60%) translateX(${translateX}px) rotate(${rotation}deg)`,
                      }}
                      animate={{
                        scale: isActive ? 1.05 : 0.95,
                        opacity: isActive ? 1 : 0.7,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Animated gradient border frame */}
                      <div className="dhaba-hero-frame w-full h-full rounded-lg shadow-2xl">
                        {/* Golden indicator dot - only show on active image */}
                        {isActive && <div className="dhaba-golden-dot" />}
                        <img 
                          src={img} 
                          alt={`Dhaba dish ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Image indicators */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                  {dhabaHeroImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDhabaHeroIndex(idx)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: idx === dhabaHeroIndex ? DHABA_THEME.secondary : 'rgba(255,255,255,0.4)',
                        transform: idx === dhabaHeroIndex ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Bottom gold accent bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full" style={{ background: DHABA_THEME.gradient.gold }} />
          </div>

          {/* DHABA Category Pills Section with Arrow Scroll */}
          <div className="sticky top-[60px] z-40 py-4" style={{ background: DHABA_THEME.primary }}>
            <div className="max-w-6xl mx-auto px-4 relative">
              {/* Left Arrow Button */}
              <button
                onClick={() => { playClick(); scrollDhabaCategories('left'); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${DHABA_THEME.secondary} 0%, ${DHABA_THEME.accent} 100%)`,
                }}
                data-testid="dhaba-scroll-left"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              
              {/* Scrollable Categories Container */}
              <div 
                ref={dhabaCategoriesRef}
                className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide mx-12"
                style={{ scrollBehavior: 'smooth' }}
              >
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { 
                      playClick(); 
                      setDhabaSelectedCategory(category.id);
                      scrollToCategory(category.id);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 hover:scale-105"
                    style={{
                      background: dhabaSelectedCategory === category.id 
                        ? DHABA_THEME.gradient.categoryBanner 
                        : 'rgba(255,255,255,0.1)',
                      color: dhabaSelectedCategory === category.id 
                        ? DHABA_THEME.accent 
                        : 'rgba(255,255,255,0.8)',
                      border: dhabaSelectedCategory === category.id 
                        ? `2px solid ${DHABA_THEME.secondary}` 
                        : '2px solid transparent',
                    }}
                    data-testid={`category-pill-dhaba-${category.id}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              {/* Right Arrow Button */}
              <button
                onClick={() => { playClick(); scrollDhabaCategories('right'); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${DHABA_THEME.secondary} 0%, ${DHABA_THEME.accent} 100%)`,
                }}
                data-testid="dhaba-scroll-right"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* DHABA Menu Content */}
          <main className="min-h-screen pb-32" style={{ background: `linear-gradient(180deg, ${DHABA_THEME.primary} 0%, ${DHABA_THEME.dark} 100%)` }}>
            <div className="max-w-6xl mx-auto px-4 py-8">
              {availableCategories.map((category) => {
                const categoryItems = getItemsByCategory(category.id);
                if (categoryItems.length === 0) return null;
                
                return (
                  <motion.section 
                    key={category.id}
                    id={`category-${category.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, transparent, ${DHABA_THEME.secondary})` }} />
                      <h2 
                        className="text-xl sm:text-2xl font-bold px-4"
                        style={{ color: DHABA_THEME.secondary }}
                      >
                        {category.name}
                      </h2>
                      <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, ${DHABA_THEME.secondary}, transparent)` }} />
                    </div>
                    
                    {/* Menu Items List */}
                    <div className="rounded-xl overflow-hidden divide-y divide-white/10" style={{ background: DHABA_THEME.gradient.card, border: `1px solid ${DHABA_THEME.secondary}30` }}>
                      {categoryItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.03 }}
                          className={`p-4 transition-all ${item.available === false ? 'opacity-60' : 'hover:bg-white/5 cursor-pointer'}`}
                          data-testid={`menu-item-dhaba-${item.id}`}
                          onMouseEnter={() => playHover()}
                        >
                          <div className="flex gap-3 sm:gap-4">
                            {/* Product Image/Video */}
                            <div className="relative w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] flex-shrink-0 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg" style={{ background: `${DHABA_THEME.primary}` }}>
                              {item.videoUrl ? (
                                <video 
                                  src={item.videoUrl}
                                  className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img 
                                  src={item.image || getItemImage(category.id, idx)}
                                  alt={item.name}
                                  className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                />
                              )}
                              {item.available === false && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-sm sm:text-[15px] leading-tight ${item.available === false ? 'text-white/50' : 'text-white'}`}>{item.name}</h4>
                              {item.description && (
                                <p className="text-xs sm:text-sm text-white/60 mt-1 leading-snug line-clamp-2">{item.description}</p>
                              )}
                              
                              {/* Variant Options or Single Price */}
                              {item.variants && item.variants.length > 0 ? (
                                <div className="mt-2 space-y-1">
                                  {item.variants.map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between">
                                      <span className={`text-xs ${(variant as any).available === false ? 'text-white/40 line-through' : 'text-white/70'}`}>{variant.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`font-semibold text-sm ${(variant as any).available === false ? 'text-white/40' : ''}`} style={(variant as any).available !== false ? { color: DHABA_THEME.secondary } : {}}>{currencySymbol}{variant.price}</span>
                                        {item.available !== false && (variant as any).available !== false ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              playClick();
                                              addVariantToCart(item, variant);
                                            }}
                                            className="w-7 h-7 rounded-full text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                                            style={{ background: DHABA_THEME.gradient.categoryBanner }}
                                            data-testid={`add-variant-dhaba-${variant.id}`}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        ) : (variant as any).available === false ? (
                                          <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-500/10 rounded">SOLD OUT</span>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`font-semibold text-sm sm:text-base ${item.available === false ? 'text-white/40' : ''}`} style={item.available !== false ? { color: DHABA_THEME.secondary } : {}}>{currencySymbol}{Number(item.price).toFixed(2)}</span>
                                  {item.available === false ? (
                                    <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                  ) : (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); playClick(); addToCart(item); }}
                                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                                      style={{ background: DHABA_THEME.gradient.categoryBanner }}
                                      data-testid={`add-item-dhaba-${item.id}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </main>

          {/* DHABA Footer */}
          <footer id="dhaba-footer" className="py-8 px-4 pb-28" style={{ background: DHABA_THEME.primary, borderTop: `2px solid ${DHABA_THEME.secondary}30` }}>
            <div className="max-w-6xl mx-auto">
              {/* Restaurant Name */}
              <h3 className="text-xl font-bold mb-4 text-center" style={{ color: DHABA_THEME.secondary }}>{restaurant.name}</h3>
              
              {/* Address and Phone */}
              <div className="text-center mb-6">
                {restaurant.address && (
                  <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" style={{ color: DHABA_THEME.secondary }} />
                    {restaurant.address}
                  </p>
                )}
                {restaurant.phone && (
                  <p className="text-gray-400 text-sm mt-1">📞 {restaurant.phone}</p>
                )}
              </div>
              
              {/* Opening Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Delivery Hours */}
                <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <h4 className="font-bold mb-3 flex items-center justify-center gap-2" style={{ color: DHABA_THEME.secondary }}>
                    <Truck className="h-5 w-5" />
                    Delivery Hours
                  </h4>
                  <div className="space-y-1 text-gray-400 text-sm">
                    <p><span className="text-white/80">Monday - Thursday:</span> {restaurant.deliveryHoursMonThu || "12PM - 10:30PM"}</p>
                    <p><span className="text-white/80">Friday - Saturday:</span> {restaurant.deliveryHoursFriSat || "12PM - 11:30PM"}</p>
                    <p><span className="text-white/80">Sunday:</span> {restaurant.deliveryHoursSun || "12PM - 10:30PM"}</p>
                  </div>
                </div>
                
                {/* Collection Hours */}
                <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <h4 className="font-bold mb-3 flex items-center justify-center gap-2" style={{ color: DHABA_THEME.secondary }}>
                    <ShoppingBag className="h-5 w-5" />
                    Collection Hours
                  </h4>
                  <div className="space-y-1 text-gray-400 text-sm">
                    <p><span className="text-white/80">Monday - Thursday:</span> {restaurant.collectionHoursMonThu || "12PM - 10:30PM"}</p>
                    <p><span className="text-white/80">Friday - Saturday:</span> {restaurant.collectionHoursFriSat || "12PM - 11:30PM"}</p>
                    <p><span className="text-white/80">Sunday:</span> {restaurant.collectionHoursSun || "12PM - 10:30PM"}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-500 text-xs">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
                <a href="/terms" className="text-gray-500 text-xs hover:text-amber-400 transition-colors" data-testid="link-terms-dhaba">Terms & Conditions</a>
              </div>
            </div>
          </footer>

          {/* DHABA Floating Cart Button */}
          {!isCartOpen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 rounded-full shadow-2xl text-white flex justify-between items-center px-6 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #c9a646 0%, #8B4513 50%, #ea580c 100%)' }}
              data-testid="button-view-basket-dhaba"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-9 w-9 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </div>
                <span className="font-bold text-lg">View Basket</span>
              </div>
              <span className="font-bold text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
          )}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent 
              className="w-full sm:max-w-md flex flex-col border-l-0"
              side="right"
              hideCloseButton={true}
              style={{ background: 'linear-gradient(180deg, #0b1d3a 0%, #132744 50%, #0a1628 100%)' }}
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="text-2xl font-bold" style={{ color: DHABA_THEME.secondary }}>
                  Your Basket
                </SheetTitle>
              </SheetHeader>

              {/* Collection Discount Notice */}
              {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && (
                <div className="py-3 px-4 rounded-lg mt-2" style={{ background: `${DHABA_THEME.green}30`, border: `1px solid ${DHABA_THEME.green}50` }}>
                  <p className="text-sm font-medium text-center" style={{ color: DHABA_THEME.accent }}>
                    ✨ {restaurant.collectionDiscountPercent}% discount over {currencySymbol}{Number(restaurant.collectionDiscountMinimum || 15).toFixed(2)} on collection
                  </p>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-auto py-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                    <ShoppingBasket className="h-16 w-16" />
                    <p>Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const itemTotalPrice = getItemTotalPrice(item);
                      const extrasTotal = item.extras.reduce((sum, extraName) => {
                        const topping = activeToppings.find(t => t.name === extraName);
                        return sum + (topping ? Number(topping.price) : 0);
                      }, 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 rounded-xl border"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                            borderColor: `${DHABA_THEME.secondary}40`,
                          }}
                        >
                          <div className="flex gap-3">
                            {/* Item Image */}
                            {item.image && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-white">{item.name}</p>
                                  <p className="text-xs text-white/60">{currencySymbol}{item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (item.quantity <= 1) {
                                        setCart(prev => prev.filter(i => i.id !== item.id));
                                      } else {
                                        setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                      }
                                    }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                                    data-testid={`decrease-qty-dhaba-${item.id}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                                    data-testid={`increase-qty-dhaba-${item.id}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              {item.extras.length > 0 && (
                                <p className="text-xs mt-1 font-medium" style={{ color: DHABA_THEME.green }}>
                                  {item.extras.join(', ')}
                                </p>
                              )}
                              {item.optionGroups && item.optionGroups.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.optionGroups.map((group, gIdx) => (
                                    <p key={gIdx} className="text-xs font-medium" style={{ color: DHABA_THEME.secondary }}>
                                      {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.removedIngredients.length > 0 && (
                                <p className="text-xs text-red-400 mt-0.5 font-medium">
                                  No: {item.removedIngredients.join(', ')}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all flex-shrink-0"
                              data-testid={`remove-item-dhaba-${item.id}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer - Total and Checkout */}
              <div className="pt-4 space-y-4">
                {/* Detailed Price Breakdown */}
                <div className="space-y-2 text-sm">
                  {restaurant?.cutleryOptionEnabled && (
                    <div
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                      style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                      onClick={() => setAddCutlery(!addCutlery)}
                      data-testid="button-add-cutlery"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                          {addCutlery && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                      </div>
                      <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/80">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                  </div>
                  {addCutlery && restaurant?.cutleryOptionEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                      <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-white/80">
                      <span>Standard Delivery</span>
                      <span className={restaurant.deliveryFeeEnabled && restaurant.freeDeliveryEnabled && cartTotal >= Number(restaurant.freeDeliveryMinimum || 0) ? "text-emerald-400" : ""}>
                        {restaurant.deliveryFeeEnabled 
                          ? (restaurant.freeDeliveryEnabled && cartTotal >= Number(restaurant.freeDeliveryMinimum || 0) 
                              ? "Free" 
                              : `${currencySymbol}${Number(restaurant.deliveryFee || 0).toFixed(2)}`)
                          : "Free"
                        }
                      </span>
                    </div>
                  )}
                  
                  {/* Service Fee */}
                  {restaurant.serviceFeeEnabled && Number(restaurant.serviceFeePercent || 0) > 0 && (
                    <div className="flex justify-between text-white/80">
                      <span>Service Fee</span>
                      <span>{currencySymbol}{(cartTotal * Number(restaurant.serviceFeePercent || 0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* VAT */}
                  {restaurant.vatEnabled && Number(restaurant.vatPercent || 0) > 0 && (
                    <div className="flex justify-between text-white/80">
                      <span>VAT ({restaurant.vatPercent}%)</span>
                      <span>{currencySymbol}{(cartTotal * Number(restaurant.vatPercent || 0) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Collection Discount */}
                  {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && cartTotal >= Number(restaurant.collectionDiscountMinimum || 15) && (
                    <div className="flex justify-between" style={{ color: DHABA_THEME.accent }}>
                      <span>Discount ({restaurant.collectionDiscountPercent}%)</span>
                      <span>-{currencySymbol}{(cartTotal * (restaurant.collectionDiscountPercent / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Free Delivery Notice */}
                  {orderType === "delivery" && restaurant.freeDeliveryEnabled && cartTotal >= Number(restaurant.freeDeliveryMinimum || 0) && (
                    <div className="flex items-center gap-2 py-2 text-emerald-400 text-xs">
                      <span className="text-emerald-500">✓</span>
                      <span>You've got free delivery!</span>
                    </div>
                  )}
                  
                  {/* Special Instructions */}
                  <div className="mt-3">
                    <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies..."
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      rows={2}
                      data-testid="input-special-instructions-dhaba"
                    />
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/20">
                    <span className="text-white">Total</span>
                    <span style={{ color: DHABA_THEME.secondary }}>
                      {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs">(incl. fees and tax)</p>
                </div>

                {/* Checkout Button */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:opacity-90 text-white"
                      style={{ background: DHABA_THEME.gradient.categoryBanner }}
                      disabled={cart.length === 0 || !isAcceptingOrders}
                      data-testid="button-checkout-dhaba"
                    >
                      {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: '#0f1419', border: '1px solid #1e2a36' }}
                  >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                      {/* Header */}
                      <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                        <CheckSquare className="h-6 w-6 text-white" />
                        <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                      </DialogHeader>
                      
                      {/* Order Type Selector */}
                      <div className="mb-4 space-y-2">
                        <Label className="text-white/80 text-sm">Order Type</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOrderType("delivery")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "delivery" 
                                ? 'border-orange-500 bg-orange-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-delivery-dhaba"
                          >
                            <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType("takeaway")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "takeaway" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-collection-dhaba"
                          >
                            <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                          </button>
                        </div>
                      </div>

                      {/* Estimated Delivery Time */}
                      {orderType === "delivery" && (
                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                              <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Your Name</Label>
                          <Input 
                            placeholder="Enter your full name" 
                            required 
                            className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                            data-testid="input-checkout-name-dhaba"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Phone Number</Label>
                          <div className="flex gap-2">
                            <div className="w-16 h-10 bg-transparent border border-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                            <Input 
                              type="tel" 
                              placeholder="7XXX XXX XXX" 
                              required 
                              className="flex-1 h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                              data-testid="input-checkout-phone-dhaba"
                            />
                          </div>
                        </div>
                        {orderType === "delivery" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Delivery Address</Label>
                              <Input 
                                placeholder="House number and street" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.deliveryAddress = e.target.value}
                                data-testid="input-checkout-address-dhaba"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Postcode</Label>
                              <Input 
                                placeholder="E.G. WD18 0AB" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                                data-testid="input-checkout-postcode-dhaba"
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Payment Method</Label>
                          <div className="flex gap-3">
                            {orderType !== "delivery" && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "cash" 
                                  ? 'border-green-500 bg-green-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-cash-dhaba"
                            >
                              <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                            </button>
                            )}
                            {hasStripeKeys && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("card")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "card" 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-card-dhaba"
                            >
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                            </button>
                            )}
                            {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("bank_transfer")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "bank_transfer" 
                                  ? 'border-purple-500 bg-purple-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-bank-dhaba"
                            >
                              <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                            </button>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                          <div className="space-y-2">
                            {cart.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {cart.length > 3 && (
                              <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                            )}
                          </div>
                          <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Section */}
                        {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <Elements stripe={stripePromise}>
                              <WalletPaymentButton
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                currency={restaurant?.currency || 'GBP'}
                                label={restaurant?.name || 'Order Total'}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              />
                              <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-[#0f1419] px-2 text-gray-500">or pay with card</span></div>
                              </div>
                              <CardPaymentForm
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                isProcessing={isProcessingPayment}
                                setIsProcessing={setIsProcessingPayment}
                                themeStyle="dhaba"
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              >
                                <div></div>
                              </CardPaymentForm>
                            </Elements>
                          </div>
                        )}
                        {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <FallbackCardForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="dhaba"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                          </div>
                        )}
                        {paymentMethod === "card" && !stripeLoadFinished && (
                          <p className="text-sm text-gray-400">Loading card payment...</p>
                        )}

                        {paymentMethod === "bank_transfer" && (
                          <BankTransferQRSection
                            restaurant={restaurant}
                            total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                            currencySymbol={currencySymbol}
                          />
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Button */}
                    <div className="p-4 border-t border-gray-800 bg-[#0f1419]">
                      {paymentMethod === "card" ? (
                        <Button 
                          type="submit"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-pay-now-dhaba"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : paymentMethod === "bank_transfer" ? (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-bank-dhaba"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <Building className="mr-2 h-5 w-5" />
                          I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-dhaba"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CheckSquare className="mr-2 h-5 w-5" />
                          Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>

          {/* Dhaba Extras Dialog */}
          <Dialog open={showDhabaExtras} onOpenChange={(open) => { setShowDhabaExtras(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(180deg, #0b1d3a 0%, #132744 50%, #0a1628 100%)', border: '1px solid rgba(201, 166, 70, 0.3)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'rgba(201, 166, 70, 0.3)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#c9a646' }} className="text-xl">Add Extras to Your Order?</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select any extras you'd like to add</p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        tempSelectedExtras.includes(topping.name)
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{topping.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#c9a646' }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {tempSelectedExtras.length > 0 && (
                <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(201, 166, 70, 0.3)', background: 'rgba(201, 166, 70, 0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="font-bold" style={{ color: '#c9a646' }}>
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(201, 166, 70, 0.3)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowDhabaExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1"
                  style={{ borderColor: 'rgba(201, 166, 70, 0.5)', color: '#c9a646', background: 'transparent' }}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    setShowDhabaExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 font-bold"
                  style={{ background: 'linear-gradient(135deg, #1f6f4d 0%, #2d8a5e 100%)', color: '#ffffff' }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* DHABA Edit Cart Item Dialog */}
          <Dialog open={!!editingCartItem} onOpenChange={(open) => !open && setEditingCartItem(null)}>
            <DialogContent 
              className="border-0 p-0 overflow-hidden max-w-sm"
              style={{
                background: DHABA_THEME.gradient.hero,
              }}
            >
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold" style={{ color: DHABA_THEME.secondary }}>
                    Edit Item
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    {editingCartItem?.name}
                  </DialogDescription>
                </DialogHeader>
                
                {editingCartItem?.description && (
                  <div className="mt-4 space-y-3">
                    <p className="text-white/80 text-sm font-medium">Remove ingredients:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editingCartItem.description.split(',').map((ingredient, idx) => {
                        const trimmedIngredient = ingredient.trim();
                        if (!trimmedIngredient) return null;
                        const isRemoved = tempRemovedIngredients.includes(trimmedIngredient);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isRemoved) {
                                setTempRemovedIngredients(prev => prev.filter(i => i !== trimmedIngredient));
                              } else {
                                setTempRemovedIngredients(prev => [...prev, trimmedIngredient]);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                              isRemoved 
                                ? 'bg-red-500/30 border border-red-500/50' 
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
                            }`}
                            data-testid={`remove-ingredient-dhaba-${idx}`}
                          >
                            <span className={`text-sm ${isRemoved ? 'text-red-300 line-through' : 'text-white'}`}>
                              {trimmedIngredient}
                            </span>
                            {isRemoved ? (
                              <X className="h-4 w-4 text-red-400" />
                            ) : (
                              <Check className="h-4 w-4" style={{ color: DHABA_THEME.green }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingCartItem(null)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingCartItem) {
                        setCart(prev => prev.map(item => 
                          item.id === editingCartItem.id 
                            ? { ...item, removedIngredients: tempRemovedIngredients }
                            : item
                        ));
                        setEditingCartItem(null);
                        toast({
                          title: "Item Updated",
                          description: tempRemovedIngredients.length > 0 
                            ? `Removed: ${tempRemovedIngredients.join(', ')}`
                            : "No changes made",
                          duration: 2000,
                        });
                      }
                    }}
                    className="flex-1 text-white"
                    style={{ background: DHABA_THEME.gradient.categoryBanner }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* DHABA Add Extras Dialog */}
          <Dialog open={!!addingExtrasToItem} onOpenChange={(open) => !open && setAddingExtrasToItem(null)}>
            <DialogContent 
              className="border-0 p-0 overflow-hidden max-w-sm"
              style={{
                background: DHABA_THEME.gradient.hero,
              }}
            >
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold" style={{ color: DHABA_THEME.secondary }}>
                    Add Extras
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    {addingExtrasToItem?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 space-y-3">
                  <p className="text-white/80 text-sm font-medium">Select extra toppings:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeToppings.length > 0 ? activeToppings.map((topping) => {
                      const isSelected = tempSelectedExtras.includes(topping.name);
                      const isSoldOut = topping.isActive === false;
                      return (
                        <button
                          key={topping.id}
                          disabled={isSoldOut}
                          onClick={() => {
                            if (isSoldOut) return;
                            if (isSelected) {
                              setTempSelectedExtras(prev => prev.filter(t => t !== topping.name));
                            } else {
                              setTempSelectedExtras(prev => [...prev, topping.name]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                            isSoldOut
                              ? 'bg-red-500/10 border border-red-500/30 cursor-not-allowed opacity-60'
                              : isSelected 
                                ? 'border' 
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
                          }`}
                          style={!isSoldOut && isSelected ? { background: `${DHABA_THEME.green}40`, borderColor: DHABA_THEME.green } : {}}
                          data-testid={`extra-topping-dhaba-${topping.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className={`text-sm flex items-center gap-2 ${isSoldOut ? 'line-through text-white/50' : isSelected ? 'font-medium' : 'text-white'}`} style={!isSoldOut && isSelected ? { color: DHABA_THEME.accent } : {}}>
                            {topping.name}
                            {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full no-underline">SOLD OUT</span>}
                          </span>
                          {isSoldOut ? (
                            <span className="text-red-400 text-xs">Unavailable</span>
                          ) : (
                            <span className={`text-sm ${isSelected ? '' : 'text-white/60'}`} style={isSelected ? { color: DHABA_THEME.accent } : {}}>
                              +{currencySymbol}{Number(topping.price).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    }) : (
                      <p className="text-white/50 text-sm text-center py-4">No extra toppings available</p>
                    )}
                  </div>
                  {tempSelectedExtras.length > 0 && (
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-sm font-medium" style={{ color: DHABA_THEME.accent }}>
                        Total extras: +{currencySymbol}{tempSelectedExtras.reduce((total, name) => {
                          const topping = activeToppings.find(t => t.name === name);
                          return total + (topping ? Number(topping.price) : 0);
                        }, 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAddingExtrasToItem(null)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (addingExtrasToItem) {
                        setCart(prev => prev.map(item => 
                          item.id === addingExtrasToItem.id 
                            ? { ...item, extras: tempSelectedExtras }
                            : item
                        ));
                        setAddingExtrasToItem(null);
                        const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                          const topping = activeToppings.find(t => t.name === name);
                          return sum + (topping ? Number(topping.price) : 0);
                        }, 0);
                      }
                    }}
                    className="flex-1 text-white"
                    style={{ background: DHABA_THEME.gradient.categoryBanner }}
                  >
                    Save Extras
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Option Group Selection Dialog - Modern Dark Purple Style */}
          <Dialog open={!!itemWithOptionsDialog} onOpenChange={(open) => { if (!open) { setItemWithOptionsDialog(null); setPendingVariant(null); } }}>
            <DialogContent 
              className="border-0 p-0 overflow-hidden max-w-sm rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              }}
            >
              <div className="p-5">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl font-bold text-white">
                    Customize Your Order
                  </DialogTitle>
                  <DialogDescription className="text-purple-200/80 text-sm">
                    {pendingVariant ? pendingVariant.variantName : itemWithOptionsDialog?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                  {itemWithOptionsDialog && (
                    <OptionGroupSelector
                      groups={getGroupsForItem(itemWithOptionsDialog.id)}
                      selections={tempOptionGroupSelections}
                      quantities={tempOptionGroupQuantities}
                      onSelectionChange={(groupId, optionIds) => {
                        setTempOptionGroupSelections(prev => ({ ...prev, [groupId]: optionIds }));
                      }}
                      onQuantityChange={(groupId, optionId, quantity) => {
                        setTempOptionGroupQuantities(prev => ({
                          ...prev,
                          [groupId]: { ...prev[groupId], [optionId]: quantity }
                        }));
                      }}
                      currencySymbol={currencySymbol}
                      themeColors={{
                        primary: "#22c55e",
                        secondary: "#16a34a",
                        selectedBg: "rgba(34,197,94,0.15)",
                        text: "#ffffff",
                      }}
                    />
                  )}
                </div>
                
                {/* Price Total Section */}
                <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total</span>
                    <span className="text-2xl font-bold text-green-400">
                      {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setItemWithOptionsDialog(null)}
                    className="flex-1 border-purple-400/30 text-white hover:bg-purple-500/20 rounded-full py-5 font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => itemWithOptionsDialog && addToCartWithOptions(itemWithOptionsDialog)}
                    className="flex-1 text-white rounded-full py-5 font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    data-testid="button-add-with-options"
                  >
                    Add to Basket - {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : isDasiFoodHubTheme ? (
        <div className="min-h-screen bg-gray-950 relative" onClick={() => {
          if (dasiMagicSoundRef.current) {
            dasiMagicSoundRef.current.currentTime = 0;
            dasiMagicSoundRef.current.play().catch(() => {});
          }
        }}>
          {/* Click sound plays on page click */}

          <style>{`
            @keyframes dasi-shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            @keyframes dasi-glow {
              0%, 100% { box-shadow: 0 0 20px rgba(255, 107, 107, 0.4), 0 0 40px rgba(254, 202, 87, 0.2); }
              50% { box-shadow: 0 0 30px rgba(72, 219, 251, 0.5), 0 0 60px rgba(255, 159, 243, 0.3); }
            }
            @keyframes dasi-pulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 0.8; }
            }
            .dasi-rainbow-text {
              background: linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3, #5f27cd);
              background-size: 200% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: dasi-shimmer 3s linear infinite;
            }
            .dasi-rainbow-border-dark {
              border: 2px solid transparent;
              background: linear-gradient(#1a1a2e, #1a1a2e) padding-box,
                          linear-gradient(135deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3) border-box;
            }
            .dasi-card-dark {
              background: linear-gradient(145deg, rgba(30, 30, 50, 0.95) 0%, rgba(20, 20, 35, 0.98) 100%);
              backdrop-filter: blur(10px);
              transition: all 0.4s ease;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .dasi-card-dark:hover {
              transform: translateY(-5px) scale(1.02);
              animation: dasi-glow 2s ease-in-out infinite;
              border-color: rgba(255, 159, 243, 0.4);
            }
            .dasi-neon-price {
              text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
            }
          `}</style>
          
          {/* Background based on type */}
          {(dasiBackgroundType === "video" || dasiHeroVideo) && dasiHeroVideo ? (
            <div className="fixed inset-0 overflow-hidden">
              <video
                ref={dasiVideoRef}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={dasiHeroVideo} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gray-950/60" />
            </div>
          ) : (dasiBackgroundType === "gif" || dasiHeroGif) && dasiHeroGif ? (
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${dasiHeroGif})` }} />
              <div className="absolute inset-0 bg-gray-950/50" />
            </div>
          ) : dasiBackgroundType === "image" && dasiStaticImage ? (
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${dasiStaticImage})` }} />
              <div className="absolute inset-0 bg-gray-950/60" />
            </div>
          ) : dasiBackgroundType === "slider" && dasiSliderImages.length > 0 ? (
            <div className="fixed inset-0 overflow-hidden">
              {dasiSliderImages.map((img: string, index: number) => (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                    index === dasiSlideIndex ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                />
              ))}
              <div className="absolute inset-0 bg-gray-950/60" />
            </div>
          ) : (
            <>
              {/* Dynamic Menu Background from Database Settings */}
              {(restaurant as any)?.menuBackgroundType === "video" && (restaurant as any)?.menuBackgroundVideoUrl ? (
                <div className="fixed inset-0">
                  <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                    <source src={(restaurant as any).menuBackgroundVideoUrl} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gray-950/60" />
                </div>
              ) : (restaurant as any)?.menuBackgroundType === "image" && (restaurant as any)?.menuBackgroundImageUrl ? (
                <div className="fixed inset-0">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${(restaurant as any).menuBackgroundImageUrl})` }} />
                  <div className="absolute inset-0 bg-gray-950/50" />
                </div>
              ) : (
                <>
                  {/* Gradient background - uses database settings or defaults */}
                  <div 
                    className="fixed inset-0"
                    style={{ 
                      background: (restaurant as any)?.menuGradientMiddle 
                        ? `linear-gradient(135deg, ${(restaurant as any)?.menuGradientStart || '#1a1a2e'}, ${(restaurant as any)?.menuGradientMiddle}, ${(restaurant as any)?.menuGradientEnd || '#1a1a2e'})`
                        : `linear-gradient(135deg, ${(restaurant as any)?.menuGradientStart || '#1a1a2e'}, ${(restaurant as any)?.menuGradientEnd || '#1a1a2e'})`
                    }}
                  />
                  {/* Rainbow accent for Dasi */}
                  <div 
                    className="fixed inset-0 bg-cover bg-center opacity-10"
                    style={{ backgroundImage: `url('/dasi-rainbow-bg.gif')`, animation: 'dasi-pulse 8s ease-in-out infinite' }}
                  />
                </>
              )}
            </>
          )}
          
          {/* Content */}
          <div className="relative z-10">
            {/* Dark Header with rainbow accent */}
            <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md shadow-2xl" style={{ borderBottom: '3px solid', borderImage: 'linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3) 1' }}>
              <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { playClick(); navigate(welcomeUrl); }}
                    className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-all"
                    data-testid="button-back-dasi"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium hidden sm:inline">Back</span>
                  </button>
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="h-10 object-contain" />
                  )}
                  <span className="dasi-rainbow-text text-xl font-bold hidden md:block">{restaurant?.name}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { playClick(); openBooking(); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-gray-800/80 border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-700/80"
                    data-testid="button-booking-dasi"
                  >
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    <span className="hidden sm:inline text-white font-medium">Booking</span>
                  </button>
                  
                  <button 
                    onClick={() => { playClick(); setShowLogin(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all bg-gray-800/80 border border-gray-700 hover:border-pink-500/50 hover:bg-gray-700/80"
                    data-testid="button-login-dasi"
                  >
                    <User className="h-4 w-4 text-pink-400" />
                    <span className="hidden sm:inline text-white font-medium">{currentCustomer ? currentCustomer.name || "Account" : "Log In"}</span>
                  </button>
                  
                  <button 
                    onClick={() => { playClick(); setShowAllergenMatrix(true); }} 
                    className="px-4 py-2 rounded-full transition-all font-semibold flex items-center gap-2 bg-gray-800/80 border border-gray-700 hover:border-orange-500/50"
                    data-testid="button-allergen-dasi"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <span className="hidden sm:inline text-white">Allergens</span>
                  </button>
                  
                </div>
              </div>
            </nav>

            {/* Menu Content with Right Category Sidebar */}
            <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
              {/* Main Menu Content */}
              <div className="flex-1">
                {availableCategories.map((category: any) => (
                  <div key={category.id} id={`dasi-cat-${category.slug}`} className="mb-12 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-6 dasi-rainbow-text">{category.name}</h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                      {menuItems
                        .filter((item: any) => (item.category === category.id || item.category === category.slug || (item as any).categorySlug === category.slug) && item.available)
                        .map((item: any, itemIndex: number) => {
                          const cardColors = [
                            { bg: 'rgba(255, 107, 107, 0.15)', border: '#ff6b6b', price: '#ff6b6b', btn: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)', darkBg: 'rgba(80, 20, 20, 0.95)' },
                            { bg: 'rgba(254, 202, 87, 0.15)', border: '#feca57', price: '#feca57', btn: 'linear-gradient(135deg, #feca57, #ffe08a)', darkBg: 'rgba(80, 60, 10, 0.95)' },
                            { bg: 'rgba(29, 209, 161, 0.15)', border: '#1dd1a1', price: '#1dd1a1', btn: 'linear-gradient(135deg, #1dd1a1, #55efc4)', darkBg: 'rgba(10, 60, 50, 0.95)' },
                            { bg: 'rgba(72, 219, 251, 0.15)', border: '#48dbfb', price: '#48dbfb', btn: 'linear-gradient(135deg, #48dbfb, #74e8ff)', darkBg: 'rgba(10, 50, 70, 0.95)' },
                            { bg: 'rgba(255, 159, 243, 0.15)', border: '#ff9ff3', price: '#ff9ff3', btn: 'linear-gradient(135deg, #ff9ff3, #ffb8f8)', darkBg: 'rgba(70, 30, 60, 0.95)' },
                            { bg: 'rgba(165, 94, 234, 0.15)', border: '#a55eea', price: '#a55eea', btn: 'linear-gradient(135deg, #a55eea, #c89eff)', darkBg: 'rgba(50, 20, 70, 0.95)' },
                            { bg: 'rgba(0, 206, 201, 0.15)', border: '#00cec9', price: '#00cec9', btn: 'linear-gradient(135deg, #00cec9, #55fff8)', darkBg: 'rgba(10, 50, 50, 0.95)' },
                            { bg: 'rgba(253, 121, 168, 0.15)', border: '#fd79a8', price: '#fd79a8', btn: 'linear-gradient(135deg, #fd79a8, #ff9dc6)', darkBg: 'rgba(70, 25, 45, 0.95)' },
                          ];
                          const colorScheme = cardColors[itemIndex % cardColors.length];
                          return (
                          <div 
                            key={item.id} 
                            className="rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-2xl"
                            style={{ 
                              background: colorScheme.bg,
                              border: `2px solid ${colorScheme.border}40`,
                              boxShadow: `0 4px 20px ${colorScheme.border}20`
                            }}
                            onClick={() => { playClick(); addToCart(item); }}
                            data-testid={`card-item-dasi-${item.id}`}
                          >
                            {item.image && (
                              <div className="h-24 sm:h-32 md:h-36 overflow-hidden relative">
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
                              </div>
                            )}
                            <div className="p-2 sm:p-3 md:p-4 backdrop-blur-sm" style={{ background: colorScheme.darkBg }}>
                              <h3 className="font-bold text-white text-xs sm:text-sm md:text-base mb-1 group-hover:text-pink-300 transition-colors line-clamp-1">{item.name}</h3>
                              {item.description && (
                                <p className="text-gray-400 text-xs mb-2 line-clamp-1 hidden md:block">{item.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm sm:text-lg md:text-xl font-bold" style={{ color: colorScheme.price }}>{currencySymbol}{Number(item.price).toFixed(2)}</span>
                                <button 
                                  className="p-1.5 sm:p-2 rounded-full text-white shadow-lg hover:scale-110 transition-all"
                                  style={{ background: colorScheme.btn, boxShadow: `0 4px 15px ${colorScheme.border}40` }}
                                  onClick={(e) => { e.stopPropagation(); playClick(); addToCart(item); }}
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );})}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Category Sidebar - Fixed on Desktop */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24 bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700/50 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 pb-2 border-b border-gray-700" style={{ borderImage: 'linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3) 1' }}>
                    Categories
                  </h3>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {availableCategories.map((category: any, index: number) => {
                      const itemCount = menuItems.filter((item: any) => 
                        (item.category === category.id || item.category === category.slug) && item.available
                      ).length;
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            playClick();
                            const el = document.getElementById(`dasi-cat-${category.slug}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl transition-all hover:bg-gray-800/80 group"
                          style={{ 
                            borderLeft: `3px solid ${['#ff6b6b', '#feca57', '#1dd1a1', '#48dbfb', '#ff9ff3', '#a55eea'][index % 6]}`
                          }}
                          data-testid={`dasi-sidebar-cat-${category.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium group-hover:text-pink-300 transition-colors">{category.name}</span>
                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{itemCount}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dasi Food Hub Footer with Opening Hours */}
          <footer className="py-10 px-4 mt-8" style={{ background: 'linear-gradient(180deg, rgba(15,15,23,0.98) 0%, rgba(26,26,46,0.95) 100%)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Restaurant Info */}
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold mb-3 dasi-rainbow-text">{restaurant?.name}</h3>
                  {restaurant?.address && (
                    <p className="text-white/70 text-sm flex items-center gap-2 justify-center md:justify-start">
                      <MapPin className="h-4 w-4 text-pink-400" />
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant?.phone && (
                    <p className="text-white/70 text-sm mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <Phone className="h-4 w-4 text-pink-400" />
                      {restaurant.phone}
                    </p>
                  )}
                </div>
                
                {/* Opening Hours */}
                <div className="text-center">
                  <h4 className="font-bold mb-4 flex items-center justify-center gap-2 text-pink-400">
                    <Clock className="h-5 w-5" />
                    Opening Hours
                  </h4>
                  <div className="space-y-2 text-white/70 text-sm">
                    <p><span className="text-white">Mon - Thu:</span> {restaurant?.deliveryHoursMonThu || "11:00 AM - 10:00 PM"}</p>
                    <p><span className="text-white">Fri - Sat:</span> {restaurant?.deliveryHoursFriSat || "11:00 AM - 11:00 PM"}</p>
                    <p><span className="text-white">Sunday:</span> {restaurant?.deliveryHoursSun || "12:00 PM - 9:00 PM"}</p>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="text-center md:text-right">
                  <h4 className="font-bold mb-4 text-cyan-400">Quick Links</h4>
                  <div className="flex flex-col gap-2 items-center md:items-end">
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-white/70 hover:text-pink-400 text-sm transition-colors"
                      data-testid="button-footer-menu-dasi"
                    >
                      Menu
                    </button>
                    <button 
                      onClick={() => { playClick(); openBooking(); }}
                      className="text-white/70 hover:text-pink-400 text-sm transition-colors"
                      data-testid="button-footer-book-dasi"
                    >
                      Book a Table
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Copyright */}
              <div className="border-t border-white/10 pt-6 text-center">
                <p className="text-white/50 text-xs">
                  © {new Date().getFullYear()} {restaurant?.name}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* Dasi Food Hub Floating Cart Button */}
          {!isCartOpen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md pointer-events-auto">
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 rounded-full shadow-2xl flex justify-between items-center px-6 transition-all hover:scale-[1.02] text-white font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #f39c12 100%)',
                boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)'
              }}
              data-testid="button-view-basket-dasi"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 h-9 w-9 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </div>
                <span className="text-lg">View Basket</span>
              </div>
              <span className="text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
          )}

          {/* Dasi Food Hub Cart Sheet */}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent 
              className="w-full sm:max-w-md flex flex-col border-l-0"
              style={{ background: 'linear-gradient(180deg, #0f0f17 0%, #1a1a2e 50%, #16213e 100%)' }}
            >
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold" style={{ background: 'linear-gradient(90deg, #ff6b6b, #feca57, #1dd1a1, #48dbfb, #ff9ff3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Your Basket
                </SheetTitle>
              </SheetHeader>

              {/* Collection Discount Notice */}
              {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && (
                <div className="py-3 px-4 bg-green-500/20 border border-green-400/30 rounded-lg mt-2">
                  <p className="text-green-400 text-sm font-medium text-center">
                    ✨ {restaurant.collectionDiscountPercent}% discount over {currencySymbol}{Number(restaurant.collectionDiscountMinimum || 15).toFixed(2)} on collection
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-auto py-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/60 space-y-4">
                    <ShoppingBasket className="h-16 w-16" />
                    <p>Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const itemTotalPrice = getItemTotalPrice(item);
                      const extrasTotal = item.extras.reduce((sum, extraName) => {
                        const topping = activeToppings.find(t => t.name === extraName);
                        return sum + (topping ? Number(topping.price) : 0);
                      }, 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 rounded-xl border border-white/20"
                          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/30 text-green-400 hover:bg-green-500/50 transition-all"
                                  data-testid={`dasi-increase-qty-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <span className="text-white font-bold text-sm w-7 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      setCart(prev => prev.filter(i => i.id !== item.id));
                                    } else {
                                      setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-all"
                                  data-testid={`dasi-decrease-qty-${item.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{item.name}</p>
                                {item.extras.length > 0 && (
                                  <p className="text-xs text-green-400 mt-0.5 font-medium">
                                    EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                                  </p>
                                )}
                                {item.optionGroups && item.optionGroups.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {item.optionGroups.map((group, gIdx) => (
                                      <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                        {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {item.removedIngredients.length > 0 && (
                                  <p className="text-xs text-red-400 mt-0.5 font-medium">NO: {item.removedIngredients.join(', ')}</p>
                                )}
                                <p className="text-sm text-white/60 mt-1">{currencySymbol}{Number(item.price).toFixed(2)} each</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="font-bold text-pink-400 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Special Instructions */}
              <div className="mt-4 px-1">
                <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Dietary requirements, allergies, extra spicy..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  rows={2}
                  data-testid="input-dasi-special-instructions"
                />
              </div>
              
              <div className="border-t border-white/20 pt-4 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span style={{ color: '#ff6b6b' }}>{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] ${!isAcceptingOrders ? 'bg-gray-500 cursor-not-allowed' : ''}`}
                      style={isAcceptingOrders ? { background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #f39c12 100%)' } : {}}
                      disabled={cart.length === 0 || !isAcceptingOrders}
                      data-testid="button-dasi-checkout"
                    >
                      {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: '#0f0f17', border: '1px solid #1e2a36' }}
                  >
                    <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                      <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                        <CheckSquare className="h-6 w-6 text-white" />
                        <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                      </DialogHeader>
                      
                      {/* Order Type Selector */}
                      <div className="mb-4 space-y-2">
                        <Label className="text-white/80 text-sm">Order Type</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOrderType("delivery")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "delivery" 
                                ? 'border-orange-500 bg-orange-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-dasi-order-delivery"
                          >
                            <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType("takeaway")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "takeaway" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-dasi-order-collection"
                          >
                            <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                          </button>
                        </div>
                      </div>

                      {/* Estimated Delivery Time */}
                      {orderType === "delivery" && (
                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                              <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Your Name</Label>
                          <Input 
                            placeholder="Enter your full name" 
                            required 
                            className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                            data-testid="input-dasi-checkout-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Phone Number</Label>
                          <div className="flex gap-2">
                            <div className="w-16 h-10 bg-transparent border border-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                            <Input 
                              type="tel" 
                              placeholder="7XXX XXX XXX" 
                              required 
                              className="flex-1 h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                              data-testid="input-dasi-checkout-phone"
                            />
                          </div>
                        </div>
                        {orderType === "delivery" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Delivery Address</Label>
                              <Input 
                                placeholder="House number and street" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerAddress = e.target.value}
                                data-testid="input-dasi-checkout-address"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Postcode</Label>
                              <Input 
                                placeholder="E.G. WD18 0AB" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                                data-testid="input-dasi-checkout-postcode"
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Payment Method</Label>
                          <div className="flex gap-3">
                            {orderType !== "delivery" && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "cash" 
                                  ? 'border-green-500 bg-green-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-dasi-payment-cash"
                            >
                              <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                            </button>
                            )}
                            {hasStripeKeys && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("card")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "card" 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-dasi-payment-card"
                            >
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                            </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("bank_transfer")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "bank_transfer" 
                                  ? 'border-purple-500 bg-purple-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-dasi-payment-bank"
                            >
                              <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                            </button>
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                          <div className="space-y-2">
                            {cart.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {cart.length > 3 && (
                              <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                            )}
                          </div>
                          <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Section */}
                        {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <Elements stripe={stripePromise}>
                              <WalletPaymentButton
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                currency={restaurant?.currency || 'GBP'}
                                label={restaurant?.name || 'Order Total'}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              />
                              <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-[#0f1419] px-2 text-gray-500">or pay with card</span></div>
                              </div>
                              <CardPaymentForm
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                isProcessing={isProcessingPayment}
                                setIsProcessing={setIsProcessingPayment}
                                themeStyle="dark"
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              >
                                <div></div>
                              </CardPaymentForm>
                            </Elements>
                          </div>
                        )}
                        {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <FallbackCardForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="dark"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                          </div>
                        )}
                        {paymentMethod === "card" && !stripeLoadFinished && (
                          <p className="text-sm text-gray-400">Loading card payment...</p>
                        )}

                        {paymentMethod === "bank_transfer" && (
                          <>
                            <BankTransferQRSection
                              restaurant={{...restaurant, bankTransferEnabled: true}}
                              total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                              currencySymbol={currencySymbol}
                              onPlaceOrder={() => {
                                handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                              }}
                            />
                            {!restaurant?.bankAccountName && !restaurant?.easypaisaAccountNumber && !restaurant?.jazzcashAccountNumber && (
                              <div className="border-t border-gray-700 pt-4 text-center">
                                <p className="text-yellow-400 text-sm">Bank details not configured yet. Please set up bank details in Super Admin to show QR code for customers.</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Button */}
                    <div className="p-4 border-t border-gray-800 bg-[#0f0f17]">
                      {paymentMethod === "card" ? (
                        <Button 
                          type="submit"
                          form="card-payment-form"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-dasi-pay-now"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : paymentMethod === "bank_transfer" ? (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg text-white transition-all"
                          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)' }}
                          disabled={createOrderMutation.isPending}
                          data-testid="button-dasi-place-order-bank"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <Building className="mr-2 h-5 w-5" />
                          Confirm Bank Transfer - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg text-white transition-all"
                          style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #f39c12 100%)' }}
                          disabled={createOrderMutation.isPending}
                          data-testid="button-dasi-place-order"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CheckSquare className="mr-2 h-5 w-5" />
                          Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : isShirinMahalTheme ? (
        <div style={{ 
          background: (restaurant as any)?.menuBackgroundType === 'video' 
            ? SHIRIN_MAHAL_THEME.gradient.header
            : (restaurant as any)?.menuBackgroundType === 'image' && (restaurant as any)?.menuBackgroundImageUrl 
              ? `url(${(restaurant as any).menuBackgroundImageUrl})` 
              : (restaurant as any)?.menuBackgroundType === 'gradient' && (restaurant as any)?.menuGradientStart
                ? `linear-gradient(135deg, ${(restaurant as any).menuGradientStart}, ${(restaurant as any).menuGradientMiddle || (restaurant as any).menuGradientEnd}, ${(restaurant as any).menuGradientEnd})`
                : SHIRIN_MAHAL_THEME.gradient.header,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          position: 'relative'
        }}>
          {/* Video Background */}
          {(restaurant as any)?.menuBackgroundType === 'video' && (restaurant as any)?.menuBackgroundVideoUrl && (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ zIndex: 0 }}
            >
              <source src={(restaurant as any).menuBackgroundVideoUrl} type="video/mp4" />
            </video>
          )}
          {/* SHIRIN MAHAL Lakers-Style Premium Navigation with Rainbow Background */}
          <style>{`
            @keyframes shirin-gold-shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes rainbow-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .shirin-gold-text { 
              background: linear-gradient(135deg, ${SHIRIN_MAHAL_THEME.gold} 0%, #f4d678 50%, ${SHIRIN_MAHAL_THEME.gold} 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .shirin-rainbow-bg {
              background: linear-gradient(135deg, 
                rgba(255, 0, 0, 0.15) 0%, 
                rgba(255, 127, 0, 0.15) 14%, 
                rgba(255, 255, 0, 0.15) 28%, 
                rgba(0, 255, 0, 0.15) 42%, 
                rgba(0, 0, 255, 0.15) 57%, 
                rgba(75, 0, 130, 0.15) 71%, 
                rgba(148, 0, 211, 0.15) 85%, 
                rgba(255, 20, 147, 0.15) 100%
              );
              background-size: 400% 400%;
              animation: rainbow-shift 15s ease infinite;
            }
          `}</style>
          
          <nav 
            className="sticky top-0 z-50 shadow-xl"
            style={{ background: SHIRIN_MAHAL_THEME.gradient.header }}
          >
            {/* Gold shimmer bar */}
            <div 
              className="h-1"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${SHIRIN_MAHAL_THEME.gold}, transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shirin-gold-shimmer 3s linear infinite'
              }}
            />
            
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Back Button + Logo */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { playClick(); navigate(welcomeUrl); }}
                    className="flex items-center gap-2 transition-all hover:scale-105"
                    style={{ color: SHIRIN_MAHAL_THEME.gold }}
                    data-testid="button-back-shirin"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium hidden sm:inline">Back</span>
                  </button>
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="h-10 object-contain" />
                  )}
                  <span className="shirin-gold-text text-xl font-bold hidden md:block">{restaurant?.name}</span>
                </div>
                
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-6 text-sm font-semibold">
                  <button 
                    onClick={() => scrollToTop()} 
                    className="text-white/80 hover:text-white transition-all py-2 border-b-2 border-transparent"
                    style={{ '--hover-border': SHIRIN_MAHAL_THEME.gold } as any}
                  >
                    Menu
                  </button>
                  <button 
                    onClick={() => { playClick(); setShowAllergenMatrix(true); }} 
                    className="px-4 py-2 rounded-lg transition-all font-semibold flex items-center gap-2"
                    style={{ 
                      background: `${SHIRIN_MAHAL_THEME.gold}20`,
                      border: `1px solid ${SHIRIN_MAHAL_THEME.gold}50`,
                      color: SHIRIN_MAHAL_THEME.gold
                    }}
                    data-testid="button-allergen-shirin"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Allergens
                  </button>
                  <button 
                    onClick={() => { playClick(); setShowLogin(true); }} 
                    className="text-white/80 hover:text-white transition-all py-2"
                    data-testid="button-login-shirin"
                  >
                    {currentCustomer ? currentCustomer.name || "Account" : "Log In"}
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Mobile Allergen Button */}
                  <button 
                    onClick={() => { playClick(); setShowAllergenMatrix(true); }}
                    className="lg:hidden p-2 rounded-lg transition-all"
                    style={{ 
                      background: `${SHIRIN_MAHAL_THEME.gold}20`,
                      border: `1px solid ${SHIRIN_MAHAL_THEME.gold}40`
                    }}
                    data-testid="button-allergen-mobile-shirin"
                  >
                    <AlertTriangle className="h-5 w-5" style={{ color: SHIRIN_MAHAL_THEME.gold }} />
                  </button>
                  
                </div>
              </div>
            </div>
          </nav>
          
          {/* Category Pills */}
          <div className="sticky top-[60px] z-40 py-3 px-4" style={{ background: SHIRIN_MAHAL_THEME.purpleLight }}>
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      playClick();
                      const el = document.getElementById(`shirin-cat-${category.slug}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                    style={{ 
                      background: `${SHIRIN_MAHAL_THEME.gold}20`,
                      border: `1px solid ${SHIRIN_MAHAL_THEME.gold}40`,
                      color: SHIRIN_MAHAL_THEME.gold
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Menu Items Grid */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            {availableCategories.map((category) => (
              <div key={category.id} id={`shirin-cat-${category.slug}`} className="mb-10">
                <h2 
                  className="text-2xl font-bold mb-4 pb-2 border-b"
                  style={{ color: SHIRIN_MAHAL_THEME.gold, borderColor: `${SHIRIN_MAHAL_THEME.gold}40` }}
                >
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems
                    .filter((item: any) => item.category === category.id || item.category === category.slug || item.categorySlug === category.slug)
                    .map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl"
                        style={{ 
                          background: SHIRIN_MAHAL_THEME.gradient.card,
                          border: `1px solid ${SHIRIN_MAHAL_THEME.gold}30`
                        }}
                        data-testid={`card-menu-item-${item.id}`}
                      >
                        {(item.image || item.gifUrl) && (
                          <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                            <img 
                              src={item.gifUrl || item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {!item.available && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOLD OUT</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-bold text-white text-lg mb-1">{item.name}</h3>
                          {item.description && (
                            <p className="text-white/60 text-sm mb-2 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span 
                              className="text-xl font-bold"
                              style={{ color: SHIRIN_MAHAL_THEME.gold }}
                            >
                              {currencySymbol}{Number(item.price).toFixed(2)}
                            </span>
                            <button 
                              className="p-2 rounded-full transition-all hover:scale-110"
                              style={{ background: SHIRIN_MAHAL_THEME.gold, color: SHIRIN_MAHAL_THEME.purple }}
                              disabled={!item.available}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Shirin Mahal Footer with Opening Hours */}
          <footer className="py-10 px-4 mt-8" style={{ background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(45,27,105,0.9) 100%)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Restaurant Info */}
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold mb-3" style={{ color: SHIRIN_MAHAL_THEME.gold }}>{restaurant?.name}</h3>
                  {restaurant?.address && (
                    <p className="text-white/70 text-sm flex items-center gap-2 justify-center md:justify-start">
                      <MapPin className="h-4 w-4" style={{ color: SHIRIN_MAHAL_THEME.gold }} />
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant?.phone && (
                    <p className="text-white/70 text-sm mt-2 flex items-center gap-2 justify-center md:justify-start">
                      <Phone className="h-4 w-4" style={{ color: SHIRIN_MAHAL_THEME.gold }} />
                      {restaurant.phone}
                    </p>
                  )}
                </div>
                
                {/* Opening Hours */}
                <div className="text-center">
                  <h4 className="font-bold mb-4 flex items-center justify-center gap-2" style={{ color: SHIRIN_MAHAL_THEME.gold }}>
                    <Clock className="h-5 w-5" />
                    Opening Hours
                  </h4>
                  <div className="space-y-2 text-white/70 text-sm">
                    <p><span className="text-white">Mon - Thu:</span> {restaurant?.deliveryHoursMonThu || "11:00 AM - 10:00 PM"}</p>
                    <p><span className="text-white">Fri - Sat:</span> {restaurant?.deliveryHoursFriSat || "11:00 AM - 11:00 PM"}</p>
                    <p><span className="text-white">Sunday:</span> {restaurant?.deliveryHoursSun || "12:00 PM - 9:00 PM"}</p>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div className="text-center md:text-right">
                  <h4 className="font-bold mb-4" style={{ color: SHIRIN_MAHAL_THEME.gold }}>Quick Links</h4>
                  <div className="flex flex-col gap-2 items-center md:items-end">
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-white/70 hover:text-amber-400 text-sm transition-colors"
                      data-testid="button-footer-menu-shirin"
                    >
                      Menu
                    </button>
                    <button 
                      onClick={() => { playClick(); openBooking(); }}
                      className="text-white/70 hover:text-amber-400 text-sm transition-colors"
                      data-testid="button-footer-book-shirin"
                    >
                      Book a Table
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Copyright */}
              <div className="border-t border-white/10 pt-6 text-center">
                <p className="text-white/50 text-xs">
                  © {new Date().getFullYear()} {restaurant?.name}. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* Shirin Mahal Floating Cart Button - Lakers Gold/Purple Style */}
          {!isCartOpen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md pointer-events-auto">
            <Button 
              onClick={() => setIsCartOpen(true)}
              className="w-full h-14 rounded-full shadow-2xl flex justify-between items-center px-6 transition-all hover:scale-[1.02] text-purple-900 font-bold"
              style={{ 
                background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%)',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.5)'
              }}
              data-testid="button-view-basket-shirin"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-900/30 h-9 w-9 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </div>
                <span className="text-lg">View Basket</span>
              </div>
              <span className="text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
          )}

          {/* Shirin Mahal Cart Sheet - Lakers Theme */}
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent 
              className="w-full sm:max-w-md flex flex-col border-l-0"
              style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d1b69 50%, #1a1a2e 100%)' }}
            >
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold" style={{ background: 'linear-gradient(90deg, #d4af37, #ffd700, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Your Basket
                </SheetTitle>
              </SheetHeader>

              {/* Collection Discount Notice */}
              {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && (
                <div className="py-3 px-4 bg-green-500/20 border border-green-400/30 rounded-lg mt-2">
                  <p className="text-green-400 text-sm font-medium text-center">
                    ✨ {restaurant.collectionDiscountPercent}% discount over {currencySymbol}{Number(restaurant.collectionDiscountMinimum || 15).toFixed(2)} on collection
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-auto py-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/60 space-y-4">
                    <ShoppingBasket className="h-16 w-16" />
                    <p>Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const itemTotalPrice = getItemTotalPrice(item);
                      const extrasTotal = item.extras.reduce((sum, extraName) => {
                        const topping = activeToppings.find(t => t.name === extraName);
                        return sum + (topping ? Number(topping.price) : 0);
                      }, 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 rounded-xl border border-yellow-600/30"
                          style={{ background: 'rgba(212, 175, 55, 0.1)', backdropFilter: 'blur(10px)' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-yellow-500/30 text-yellow-400 hover:bg-yellow-500/50 transition-all"
                                  data-testid={`shirin-increase-qty-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <span className="text-white font-bold text-sm w-7 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      setCart(prev => prev.filter(i => i.id !== item.id));
                                    } else {
                                      setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-all"
                                  data-testid={`shirin-decrease-qty-${item.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{item.name}</p>
                                {item.extras.length > 0 && (
                                  <p className="text-xs text-yellow-400 mt-0.5 font-medium">
                                    EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                                  </p>
                                )}
                                {item.optionGroups && item.optionGroups.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {item.optionGroups.map((group, gIdx) => (
                                      <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                        {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {item.removedIngredients.length > 0 && (
                                  <p className="text-xs text-red-400 mt-0.5 font-medium">NO: {item.removedIngredients.join(', ')}</p>
                                )}
                                <p className="text-sm text-white/60 mt-1">{currencySymbol}{Number(item.price).toFixed(2)} each</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="font-bold text-yellow-400 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Special Instructions */}
              <div className="mt-4 px-1">
                <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Dietary requirements, allergies, extra spicy..."
                  className="w-full p-3 rounded-xl bg-white/10 border border-yellow-600/30 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  rows={2}
                  data-testid="input-shirin-special-instructions"
                />
              </div>
              
              <div className="border-t border-yellow-600/30 pt-4 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span style={{ color: '#d4af37' }}>{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] ${!isAcceptingOrders ? 'bg-gray-500 cursor-not-allowed' : 'text-purple-900'}`}
                      style={isAcceptingOrders ? { background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%)' } : {}}
                      disabled={cart.length === 0 || !isAcceptingOrders}
                      data-testid="button-shirin-checkout"
                    >
                      {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: '#1a1a2e', border: '1px solid #d4af3730' }}
                  >
                    <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                      <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                        <CheckSquare className="h-6 w-6 text-yellow-400" />
                        <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                      </DialogHeader>
                      
                      {/* Order Type Selector */}
                      <div className="mb-4 space-y-2">
                        <Label className="text-white/80 text-sm">Order Type</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOrderType("delivery")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "delivery" 
                                ? 'border-yellow-500 bg-yellow-500/20' 
                                : 'border-purple-700 bg-purple-800/50 hover:border-purple-600'
                            }`}
                            data-testid="button-shirin-order-delivery"
                          >
                            <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-yellow-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType("takeaway")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "takeaway" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-purple-700 bg-purple-800/50 hover:border-purple-600'
                            }`}
                            data-testid="button-shirin-order-collection"
                          >
                            <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                          </button>
                        </div>
                      </div>

                      {/* Estimated Delivery Time */}
                      {orderType === "delivery" && (
                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                              <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Your Name</Label>
                          <Input 
                            placeholder="Enter your full name" 
                            required 
                            className="h-10 bg-transparent border-purple-700 text-white placeholder:text-gray-500 focus:border-yellow-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                            data-testid="input-shirin-checkout-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Phone Number</Label>
                          <div className="flex gap-2">
                            <div className="w-16 h-10 bg-transparent border border-purple-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                            <Input 
                              type="tel" 
                              placeholder="7XXX XXX XXX" 
                              required 
                              className="flex-1 h-10 bg-transparent border-purple-700 text-white placeholder:text-gray-500 focus:border-yellow-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                              data-testid="input-shirin-checkout-phone"
                            />
                          </div>
                        </div>
                        {orderType === "delivery" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Delivery Address</Label>
                              <Input 
                                placeholder="House number and street" 
                                required 
                                className="h-10 bg-transparent border-purple-700 text-white placeholder:text-gray-500 focus:border-yellow-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerAddress = e.target.value}
                                data-testid="input-shirin-checkout-address"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Postcode</Label>
                              <Input 
                                placeholder="E.G. WD18 0AB" 
                                required 
                                className="h-10 bg-transparent border-purple-700 text-white placeholder:text-gray-500 focus:border-yellow-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                                data-testid="input-shirin-checkout-postcode"
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Payment Method</Label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "cash" 
                                  ? 'border-green-500 bg-green-500/20' 
                                  : 'border-purple-700 bg-purple-800/50 hover:border-purple-600'
                              }`}
                              data-testid="button-shirin-payment-cash"
                            >
                              <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                            </button>
                            {hasStripeKeys && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("card")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "card" 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-purple-700 bg-purple-800/50 hover:border-purple-600'
                              }`}
                              data-testid="button-shirin-payment-card"
                            >
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                            </button>
                            )}
                            {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("bank_transfer")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "bank_transfer" 
                                  ? 'border-purple-500 bg-purple-500/20' 
                                  : 'border-purple-700 bg-purple-800/50 hover:border-purple-600'
                              }`}
                              data-testid="button-shirin-payment-bank"
                            >
                              <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                            </button>
                            )}
                          </div>
                        </div>

                        {paymentMethod === "bank_transfer" && (
                          <BankTransferQRSection
                            restaurant={restaurant}
                            total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                            currencySymbol={currencySymbol}
                          />
                        )}

                        {/* Order Summary */}
                        <div className="border-t border-purple-700 pt-4 mt-4">
                          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                          <div className="space-y-2">
                            {cart.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {cart.length > 3 && (
                              <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                            )}
                          </div>
                          <div className="border-t border-purple-700 mt-3 pt-3 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-yellow-400">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Section */}
                        {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                          <div className="border-t border-purple-700 pt-4">
                            <Elements stripe={stripePromise}>
                              <WalletPaymentButton
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                currency={restaurant?.currency || 'GBP'}
                                label={restaurant?.name || 'Order Total'}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              />
                              <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-purple-700/50" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-[#1e1b4b] px-2 text-gray-500">or pay with card</span></div>
                              </div>
                              <CardPaymentForm
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                isProcessing={isProcessingPayment}
                                setIsProcessing={setIsProcessingPayment}
                                themeStyle="dark"
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              >
                                <div></div>
                              </CardPaymentForm>
                            </Elements>
                          </div>
                        )}
                        {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                          <div className="border-t border-purple-700 pt-4">
                            <FallbackCardForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="dark"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                          </div>
                        )}
                        {paymentMethod === "card" && !stripeLoadFinished && (
                          <p className="text-sm text-gray-400">Loading card payment...</p>
                        )}
                        {cardError && (
                          <p className="text-sm text-red-400">{cardError}</p>
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Button */}
                    <div className="p-4 border-t border-purple-800 bg-[#1a1a2e]">
                      {paymentMethod === "card" ? (
                        <Button 
                          type="submit"
                          form="card-payment-form"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-shirin-pay-now"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            formData.set('customerName', checkoutFormDataRef.current.customerName);
                            formData.set('customerPhone', checkoutFormDataRef.current.customerPhone);
                            formData.set('deliveryAddress', checkoutFormDataRef.current.customerAddress);
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.customerAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg text-purple-900 transition-all"
                          style={{ background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #d4af37 100%)' }}
                          disabled={createOrderMutation.isPending}
                          data-testid="button-shirin-place-order"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CheckSquare className="mr-2 h-5 w-5" />
                          Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : isTawaWatfordTheme ? (
        <>
          {/* TAWA WATFORD PREMIUM MENU - Navy Blue & Gold Theme */}
          <style>{`
            .watford-gold-text { 
              background: linear-gradient(135deg, #c9a646 0%, #f4d678 50%, #c9a646 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .watford-gold-border { border: 1px solid rgba(201, 166, 70, 0.4); }
            .watford-premium-glow { box-shadow: 0 4px 30px rgba(201, 166, 70, 0.15); }
            .watford-category-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(201, 166, 70, 0.3); }
          `}</style>
          
          {/* Top Navigation */}
          <nav className="sticky top-0 z-50 border-b border-yellow-600/20" style={{ background: 'linear-gradient(180deg, rgba(15, 28, 46, 0.98) 0%, rgba(30, 58, 95, 0.95) 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <button 
                onClick={() => { playClick(); navigate(welcomeUrl); }}
                className="flex items-center gap-2 text-yellow-300 hover:text-yellow-200 transition-all"
                data-testid="button-back-watford"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">BACK</span>
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { playClick(); setShowAllergenMatrix(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-800/50 hover:bg-blue-700/60 border border-yellow-500/30 text-yellow-200 transition-all"
                  data-testid="button-allergens-watford"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-300" />
                  <span className="font-medium hidden sm:inline">Allergens</span>
                </button>
                <button 
                  onClick={() => { 
                    playClick(); 
                    setShowWatfordBookingInline(!showWatfordBookingInline);
                    if (!showWatfordBookingInline) {
                      setTimeout(() => {
                        document.getElementById('watford-booking-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-500/30 transition-all ${showWatfordBookingInline ? 'bg-yellow-500/30 text-yellow-100' : 'bg-blue-800/50 hover:bg-blue-700/60 text-yellow-200'}`}
                  data-testid="button-booking-watford"
                >
                  <Calendar className="h-4 w-4 text-yellow-300" />
                  <span className="font-medium hidden sm:inline">{showWatfordBookingInline ? 'Hide Booking' : 'Booking'}</span>
                </button>
                <button 
                  onClick={() => { playClick(); setShowLogin(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-800/50 hover:bg-blue-700/60 border border-yellow-500/30 text-yellow-200 transition-all"
                  data-testid="button-login-watford"
                >
                  <User className="h-4 w-4 text-yellow-300" />
                  <span className="font-medium hidden sm:inline">{currentCustomer ? currentCustomer.name || "Account" : "Log In"}</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section with Auto-Rotating Slider */}
          {(() => {
            const watfordHeroSlides = [
              { image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&h=600&fit=crop', title: 'SPECIAL MENU', subtitle: 'Authentic Flavors, Royal Experience' },
              { image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1600&h=600&fit=crop', title: 'BIRYANI SPECIAL', subtitle: 'Aromatic Rice & Tender Meat' },
              { image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=1600&h=600&fit=crop', title: 'GRILL PLATTERS', subtitle: 'Sizzling Hot & Fresh' },
              { image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=1600&h=600&fit=crop', title: 'KARAHI DELIGHTS', subtitle: 'Traditional Wok Cooking' },
            ];
            return (
              <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
                {watfordHeroSlides.map((slide, idx) => (
                  <motion.div 
                    key={idx}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: tawaSliderIndex === idx ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${slide.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent" />
                    <div className="absolute inset-0 flex items-center">
                      <div className="px-6 sm:px-10 max-w-xl">
                        <p className="text-yellow-400 text-lg sm:text-xl italic font-light mb-1">Premium Dining</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight watford-gold-text">
                          {slide.title.split(' ').map((word, i) => <span key={i}>{word}<br/></span>)}
                        </h2>
                        <p className="text-yellow-100/80 text-sm sm:text-base mt-2 italic">{slide.subtitle}</p>
                        <button 
                          onClick={() => scrollToCategory(availableCategories[0]?.id || '')}
                          className="mt-4 px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-blue-900 font-bold rounded-lg transition-all shadow-lg"
                          data-testid="button-order-now-watford"
                        >
                          Order Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {/* Slider Dots */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {watfordHeroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTawaSliderIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-all ${tawaSliderIndex === idx ? 'bg-yellow-400 scale-110' : 'bg-white/40 hover:bg-white/60'}`}
                      data-testid={`slider-dot-${idx}`}
                    />
                  ))}
                </div>
                {/* Slider Arrows */}
                <button 
                  onClick={() => setTawaSliderIndex((prev) => (prev - 1 + watfordHeroSlides.length) % watfordHeroSlides.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-900/50 hover:bg-blue-800/70 border border-yellow-500/30 flex items-center justify-center transition-all"
                  data-testid="slider-prev"
                >
                  <ChevronLeft className="h-6 w-6 text-yellow-300" />
                </button>
                <button 
                  onClick={() => setTawaSliderIndex((prev) => (prev + 1) % watfordHeroSlides.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-900/50 hover:bg-blue-800/70 border border-yellow-500/30 flex items-center justify-center transition-all"
                  data-testid="slider-next"
                >
                  <ChevronRight className="h-6 w-6 text-yellow-300" />
                </button>
              </div>
            );
          })()}

          {/* Restaurant Info Bar */}
          <div className="border-b border-yellow-600/20" style={{ background: 'linear-gradient(180deg, #1a2d47 0%, #0f1c2e 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold watford-gold-text">{restaurant.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-100/70 text-sm">{restaurant.address}</span>
                  </div>
                </div>
                {/* Collect Card - Left Aligned */}
                <div className="watford-gold-border rounded-xl px-4 py-2 flex items-center gap-3 w-fit" style={{ background: 'rgba(30, 58, 95, 0.5)' }}>
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Store className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-yellow-100/50 text-xs uppercase">Collect</p>
                    <p className="text-white font-medium text-sm">{restaurant.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Watford Floating Right-Side Booking Card */}
          <AnimatePresence>
            {showWatfordBookingInline && (
              <motion.div 
                id="watford-booking-section"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed right-4 top-20 z-40 w-80 max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ 
                  background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 100%)',
                  border: '2px solid rgba(201, 166, 70, 0.4)'
                }}
              >
                {bookingSubmitted ? (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold watford-gold-text mb-2">Booking Received!</h3>
                    <p className="text-yellow-100/70 text-sm mb-4">
                      Your booking request has been submitted. Please wait for the manager to confirm your reservation via WhatsApp.
                    </p>
                    <div className="p-3 rounded-lg bg-blue-900/50 border border-yellow-500/20 mb-4">
                      <p className="text-yellow-100/60 text-xs mb-1">You will receive confirmation at:</p>
                      <p className="text-white font-medium">{bookingCountryCode} {bookingPhone}</p>
                    </div>
                    <Button
                      onClick={() => {
                        setBookingSubmitted(false);
                        setShowWatfordBookingInline(false);
                      }}
                      variant="outline"
                      className="w-full border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/20"
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-yellow-500/20 flex items-center justify-between">
                      <h3 className="text-lg font-bold watford-gold-text">Book a Table</h3>
                      <button 
                        onClick={() => setShowWatfordBookingInline(false)}
                        className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-yellow-300 hover:bg-blue-800/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-yellow-200 mb-1">Date</label>
                          <Popover open={bookingCalendarOpen} onOpenChange={setBookingCalendarOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-full h-10 px-3 text-sm bg-blue-900/50 border border-yellow-500/30 rounded-md flex items-center gap-2 text-left hover:bg-blue-800/50 transition-colors"
                                data-testid="button-booking-date"
                              >
                                <Calendar className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                                <span className={bookingDate ? "text-white" : "text-white/50"}>
                                  {bookingDate ? format(new Date(bookingDate), "dd/MM/yyyy") : "Select date"}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-yellow-500/30" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={bookingDate ? new Date(bookingDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setBookingDate(format(date, "yyyy-MM-dd"));
                                  }
                                  setBookingCalendarOpen(false);
                                }}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-yellow-200 mb-1">Time</label>
                          <select
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full h-10 px-2 text-sm border rounded-md bg-blue-900/50 border-yellow-500/30 text-white"
                          >
                            <option value="" className="bg-slate-800">Select</option>
                            <option value="12:00" className="bg-slate-800">12:00 PM</option>
                            <option value="13:00" className="bg-slate-800">1:00 PM</option>
                            <option value="14:00" className="bg-slate-800">2:00 PM</option>
                            <option value="17:00" className="bg-slate-800">5:00 PM</option>
                            <option value="18:00" className="bg-slate-800">6:00 PM</option>
                            <option value="19:00" className="bg-slate-800">7:00 PM</option>
                            <option value="20:00" className="bg-slate-800">8:00 PM</option>
                            <option value="21:00" className="bg-slate-800">9:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-yellow-500/20">
                          <span className="text-sm text-yellow-100">Adults</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setAdults(Math.max(0, adults - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                            <span className="w-6 text-center text-white font-bold">{adults}</span>
                            <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-yellow-500/20">
                          <span className="text-sm text-yellow-100">Children <span className="text-xs text-yellow-100/50">(2-12)</span></span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                            <span className="w-6 text-center text-white font-bold">{children}</span>
                            <button onClick={() => setChildren(children + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-900/30 border border-yellow-500/20">
                          <span className="text-sm text-yellow-100">Infants <span className="text-xs text-yellow-100/50">(0-2)</span></span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setInfants(Math.max(0, infants - 1))} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">-</button>
                            <span className="w-6 text-center text-white font-bold">{infants}</span>
                            <button onClick={() => setInfants(infants + 1)} className="w-7 h-7 rounded-full border border-yellow-500/40 flex items-center justify-center text-yellow-300 hover:bg-yellow-500/20 text-sm">+</button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-yellow-200 mb-1">Name *</label>
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          className="h-10 text-sm bg-blue-900/50 border-yellow-500/30 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-yellow-200 mb-1">Phone * (WhatsApp)</label>
                        <div className="flex gap-2">
                          <select
                            value={bookingCountryCode}
                            onChange={(e) => setBookingCountryCode(e.target.value)}
                            className="w-24 h-10 px-2 text-sm border rounded-md bg-blue-900/50 border-yellow-500/30 text-white"
                          >
                            <option value="+44" className="bg-slate-800">🇬🇧 +44</option>
                            <option value="+1" className="bg-slate-800">🇺🇸 +1</option>
                            <option value="+91" className="bg-slate-800">🇮🇳 +91</option>
                            <option value="+92" className="bg-slate-800">🇵🇰 +92</option>
                            <option value="+971" className="bg-slate-800">🇦🇪 +971</option>
                            <option value="+33" className="bg-slate-800">🇫🇷 +33</option>
                            <option value="+49" className="bg-slate-800">🇩🇪 +49</option>
                          </select>
                          <Input
                            type="tel"
                            placeholder="Phone number"
                            value={bookingPhone}
                            onChange={(e) => setBookingPhone(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 h-10 text-sm bg-blue-900/50 border-yellow-500/30 text-white placeholder:text-white/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-yellow-200 mb-1">Email</label>
                        <Input
                          type="email"
                          placeholder="Your email"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="h-10 text-sm bg-blue-900/50 border-yellow-500/30 text-white placeholder:text-white/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-yellow-200 mb-1">♿ Special Assistance / Accessibility Needs</label>
                        <textarea
                          placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                          value={bookingSpecialRequests}
                          onChange={(e) => setBookingSpecialRequests(e.target.value)}
                          className="w-full h-16 px-3 py-2 text-sm border rounded-md bg-blue-900/50 border-yellow-500/30 text-white placeholder:text-white/50 resize-none"
                        />
                      </div>

                      <Button
                        onClick={async () => {
                          if (!bookingDate || !bookingTime || !bookingName || !bookingPhone) {
                            toast({ title: "Please fill in all required fields", variant: "destructive" });
                            return;
                          }
                          try {
                            await createBookingMutation.mutateAsync({
                              restaurantId: restaurant.id,
                              date: bookingDate,
                              time: bookingTime,
                              guests: adults + children + infants,
                              adults,
                              children,
                              infants,
                              customerName: bookingName,
                              phone: `${bookingCountryCode}${bookingPhone}`,
                              email: bookingEmail || "not-provided@example.com",
                              specialHelp: bookingSpecialRequests,
                              status: "pending",
                            });
                            setBookingSubmitted(true);
                          } catch (error) {
                            toast({ title: "Booking failed", description: "Please try again", variant: "destructive" });
                          }
                        }}
                        className="w-full h-12 text-base font-bold rounded-xl text-blue-900"
                        style={{ background: 'linear-gradient(135deg, #c9a646 0%, #f4d678 50%, #c9a646 100%)' }}
                        disabled={createBookingMutation.isPending}
                      >
                        {createBookingMutation.isPending ? "Submitting..." : "Confirm Booking"}
                      </Button>

                      <p className="text-xs text-yellow-100/50 text-center">
                        Manager will confirm via WhatsApp
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Promo Banner */}
          <div className="px-4 py-4" style={{ background: 'linear-gradient(180deg, #0f1c2e 0%, #1a2d47 100%)' }}>
            <div className="max-w-6xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">25% off your 1st online order</p>
                  <p className="text-white/80 text-sm">Use code FIRST25 at checkout</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content - Menu Left, Categories Right */}
          <div className="flex-1 overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #1a2d47 0%, #0f1c2e 50%, #1a2d47 100%)' }}>
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex gap-6 relative">
                {/* Left Side - Menu Items */}
                <div className="flex-1 overflow-hidden pr-20 lg:pr-0">
                  {/* Menu Items by Category */}
                  {availableCategories.map((category) => {
                    const categoryItems = menuItems.filter((item: MenuItemType) => item.category === category.id);
                    if (categoryItems.length === 0) return null;
                    return (
                      <div 
                        key={category.id} 
                        id={`category-${category.id}`}
                        className="mb-8"
                      >
                        <h3 className="text-xl font-bold watford-gold-text mb-4 flex items-center gap-2">
                          {category.displayName || category.name}
                          <ChevronUp className="h-5 w-5 text-yellow-400" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryItems.map((item: MenuItemType) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="watford-gold-border rounded-xl overflow-hidden flex watford-premium-glow watford-category-card transition-all cursor-pointer"
                              style={{ background: 'rgba(30, 58, 95, 0.6)' }}
                              onClick={() => addToCart(item)}
                              data-testid={`menu-item-${item.id}`}
                            >
                              <div className="w-24 h-24 flex-shrink-0">
                                <img 
                                  src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop'} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 p-3 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                                  {item.description && (
                                    <p className="text-yellow-100/60 text-xs line-clamp-2 mt-1">{item.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div>
                                    <span className="text-yellow-100/50 text-xs">FROM</span>
                                    <p className="text-green-400 font-bold">{currencySymbol}{item.price}</p>
                                  </div>
                                  <button 
                                    className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all"
                                    data-testid={`add-item-${item.id}`}
                                  >
                                    <Plus className="h-5 w-5 text-white" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side - Category Cards (Desktop) - Fixed Position Below Header */}
                <div className="hidden lg:block w-64 flex-shrink-0">
                  <div className="fixed top-[70px] right-8 w-60 z-30">
                    <h3 className="text-lg font-bold watford-gold-text mb-4">Categories</h3>
                    <ScrollArea className="h-[calc(100vh-120px)]">
                      <div className="space-y-3 pr-2">
                        {availableCategories.map((category, index) => (
                          <motion.div
                            key={category.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => scrollToCategory(category.id)}
                            className={`watford-gold-border rounded-xl p-3 cursor-pointer watford-category-card transition-all ${
                              activeCategoryId === category.id 
                                ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/20 border-yellow-400/60' 
                                : ''
                            }`}
                            style={{ background: activeCategoryId === category.id ? undefined : 'rgba(30, 58, 95, 0.5)' }}
                            data-testid={`category-card-${category.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-blue-800/50">
                                {category.videoUrl ? (
                                  <video 
                                    src={category.videoUrl} 
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                ) : category.gifUrl ? (
                                  <img 
                                    src={category.gifUrl} 
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : category.imageUrl ? (
                                  <img 
                                    src={category.imageUrl} 
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">
                                    {category.icon || '🍽️'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm truncate ${activeCategoryId === category.id ? 'text-yellow-300' : 'text-white'}`}>
                                  {category.displayName || category.name}
                                </p>
                                <p className="text-yellow-100/50 text-xs">
                                  {menuItems.filter((item: MenuItemType) => item.category === category.id).length} items
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Category Sidebar - Fixed RIGHT Side Below Header */}
          <div className="lg:hidden fixed right-0 top-[70px] z-40">
            <div className="bg-blue-900/95 border-l border-yellow-500/30 rounded-l-xl py-3 shadow-xl">
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="flex flex-col gap-2 px-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className={`w-[72px] min-h-[72px] rounded-lg flex flex-col items-center justify-center p-1 transition-all ${
                        activeCategoryId === category.id 
                          ? 'bg-gradient-to-br from-yellow-600 to-yellow-500' 
                          : 'bg-blue-800/60 hover:bg-blue-700/80'
                      }`}
                      data-testid={`mobile-category-${category.id}`}
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        {category.videoUrl ? (
                          <video 
                            src={category.videoUrl} 
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : category.gifUrl ? (
                          <img 
                            src={category.gifUrl} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : category.imageUrl ? (
                          <img 
                            src={category.imageUrl} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{category.icon || '🍽️'}</span>
                        )}
                      </div>
                      <span className={`text-[11px] mt-1 leading-tight w-full text-center px-0.5 font-semibold ${
                        activeCategoryId === category.id ? 'text-blue-900' : 'text-yellow-100'
                      }`} style={{ wordBreak: 'break-word' }}>
                        {(category.displayName || category.name).slice(0, 10)}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-yellow-600/20 py-8 pb-28" style={{ background: 'rgba(15, 28, 46, 0.98)' }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="watford-gold-text text-lg font-bold">{restaurant.name}</p>
                <p className="text-yellow-100/50 text-sm">{restaurant.address}</p>
                <div className="watford-gold-border rounded-xl overflow-hidden w-48 h-28">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2476.234912345678!2d-0.3969!3d51.6545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761471c6e3f3d5%3A0x1234567890abcdef!2s195%20Saint%20Albans%20Road%2C%20Watford!5e0!3m2!1sen!2suk!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                </div>
                <p className="text-yellow-100/40 text-xs mt-2">© {new Date().getFullYear()} All Rights Reserved</p>
              </div>
            </div>
          </footer>

          {/* Back to Top Button */}
          <AnimatePresence>
            {showBackToTop && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center watford-gold-border"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1c2e 100%)' }}
                data-testid="button-back-to-top-watford"
              >
                <ArrowUp className="h-5 w-5 text-yellow-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Floating Cart Button */}
          {cart.length > 0 && !isCartOpen && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-4 left-4 right-20 lg:right-4 z-50"
            >
              <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full max-w-sm lg:max-w-md mx-auto flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 rounded-full shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
                data-testid="button-view-basket"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold">{cart.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)}</span>
                  </div>
                  <span className="text-white font-bold">View Basket</span>
                </div>
                <span className="text-white font-bold">{currencySymbol}{cartTotal.toFixed(2)}</span>
              </button>
            </motion.div>
          )}

          {/* Extras Step Dialog - Shows before cart when toppings available */}
          <Dialog open={showExtrasStep} onOpenChange={(open) => { setShowExtrasStep(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a2d47 100%)', border: '2px solid rgba(201, 166, 70, 0.3)' }}>
              <div className="p-4 border-b border-yellow-500/30">
                <DialogHeader>
                  <DialogTitle className="watford-gold-text text-xl">Add Extras to Your Order?</DialogTitle>
                </DialogHeader>
                <p className="text-yellow-100/60 text-sm mt-1">Select any extras you'd like to add</p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        tempSelectedExtras.includes(topping.name)
                          ? 'border-yellow-500 bg-yellow-500/20'
                          : 'border-yellow-500/30 hover:border-yellow-500/50'
                      }`}
                    >
                      <p className="text-white font-medium text-sm">{topping.name}</p>
                      <p className="text-yellow-400 text-xs mt-1">+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                      {tempSelectedExtras.includes(topping.name) && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-yellow-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* Selection Summary */}
              {tempSelectedExtras.length > 0 && (
                <div className="px-4 py-2 border-t border-yellow-500/20" style={{ background: 'rgba(201, 166, 70, 0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-100/70 text-sm">{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="watford-gold-text font-bold">
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 border-t border-yellow-500/30 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowExtrasStep(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/10"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    setShowExtrasStep(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 text-blue-900 font-bold"
                  style={{ background: 'linear-gradient(135deg, #c9a646 0%, #f4d678 100%)' }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cart Sheet with Extras Upsell */}
          <Sheet open={isCartOpen} onOpenChange={(open) => { setIsCartOpen(open); if (!open) setTempSelectedExtras([]); }}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-blue-900 border-yellow-500/30 text-white p-0 flex flex-col">
              <div className="p-4 border-b border-yellow-500/30">
                <SheetHeader>
                  <SheetTitle className="watford-gold-text text-xl">Your Basket</SheetTitle>
                </SheetHeader>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                  <p className="text-yellow-100/60 text-center py-8">Your basket is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item: CartItem) => (
                      <div key={item.id} className="watford-gold-border rounded-lg p-3" style={{ background: 'rgba(30, 58, 95, 0.5)' }}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-white">{item.name}</p>
                            {item.extras && item.extras.length > 0 && (
                              <p className="text-yellow-300/70 text-xs">+ {item.extras.map((e: any) => e.name).join(', ')}</p>
                            )}
                            <p className="text-yellow-400 text-sm">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  setCart(prev => prev.filter(i => i.id !== item.id));
                                } else {
                                  setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                }
                              }}
                              className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center hover:bg-blue-700"
                            >
                              <Minus className="h-4 w-4 text-yellow-300" />
                            </button>
                            <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                              className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 text-yellow-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Selected Extras Summary (from extras step) */}
                    {tempSelectedExtras.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-yellow-500/20">
                        <p className="text-yellow-400 text-sm font-medium mb-2">Selected Extras:</p>
                        <div className="flex flex-wrap gap-2">
                          {tempSelectedExtras.map((name) => (
                            <span key={name} className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              
              {cart.length > 0 && (() => {
                const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                  const topping = activeToppings.find((t: ExtraTopping) => t.name === name);
                  return sum + (topping ? Number(topping.price) : 0);
                }, 0);
                const cutleryAmount = (addCutlery && restaurant?.cutleryOptionEnabled) ? Number((restaurant as any).cutleryPrice || 0.50) : 0;
                const subtotalWithExtras = cartTotal + extrasTotal;
                const deliveryFeeAmount = (orderType === 'delivery' && restaurant?.deliveryFeeEnabled) 
                  ? (restaurant?.freeDeliveryEnabled && subtotalWithExtras >= Number(restaurant?.freeDeliveryMinimum || 0) ? 0 : Number(restaurant?.deliveryFee || 0))
                  : 0;
                const vatAmount = restaurant?.vatEnabled ? subtotalWithExtras * Number(restaurant?.vatPercent || 20) / 100 : 0;
                const serviceFeeAmount = restaurant?.serviceFeeEnabled ? subtotalWithExtras * Number(restaurant?.serviceFeePercent || 0) / 100 : 0;
                const grandTotal = subtotalWithExtras + deliveryFeeAmount + vatAmount + serviceFeeAmount + cutleryAmount;
                
                return (
                  <div className="p-4 border-t border-yellow-500/30" style={{ background: 'rgba(15, 28, 46, 0.95)' }}>
                    {/* Order Summary */}
                    <div className="space-y-2 mb-4">
                      {restaurant?.cutleryOptionEnabled && (
                        <div
                          className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                          style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                          onClick={() => setAddCutlery(!addCutlery)}
                          data-testid="button-add-cutlery"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                              {addCutlery && <span className="text-white text-xs">✓</span>}
                            </div>
                            <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                          </div>
                          <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-yellow-100/70">Subtotal:</span>
                        <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                      </div>
                      {addCutlery && restaurant?.cutleryOptionEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                          <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                        </div>
                      )}
                      {extrasTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-100/70">Extras:</span>
                          <span className="text-white">+{currencySymbol}{extrasTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-100/70">Delivery:</span>
                          <span className="text-white">{currencySymbol}{deliveryFeeAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {restaurant?.vatEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-100/70">VAT ({restaurant?.vatPercent || 20}%):</span>
                          <span className="text-white">{currencySymbol}{vatAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                        <span className="text-yellow-100 font-semibold">Total:</span>
                        <span className="watford-gold-text text-xl font-bold">
                          {currencySymbol}{grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Special Instructions */}
                    <div className="mt-3">
                      <label className="text-yellow-100/70 text-sm mb-2 block">Special Instructions (optional)</label>
                      <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="e.g., Wheelchair access, dietary requirements, allergies..."
                        className="w-full p-3 rounded-xl bg-blue-800/50 border border-yellow-500/30 text-white placeholder-yellow-100/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                        rows={2}
                        data-testid="input-special-instructions-watford"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                      className="w-full py-6 text-lg font-bold text-blue-900"
                      style={{ background: 'linear-gradient(135deg, #c9a646 0%, #f4d678 100%)' }}
                      data-testid="button-checkout-watford"
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                );
              })()}
            </SheetContent>
          </Sheet>

          {/* Full Checkout Dialog */}
          <Dialog open={isCheckoutOpen} onOpenChange={(open) => { setIsCheckoutOpen(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="bg-blue-900 border-yellow-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto p-0">
              <div className="p-4 border-b border-yellow-500/30">
                <DialogHeader>
                  <DialogTitle className="watford-gold-text text-xl">Checkout</DialogTitle>
                </DialogHeader>
              </div>
              
              <div className="p-4 space-y-6">
                {/* Order Type Selection */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-3">Order Type</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType('takeaway')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        orderType === 'takeaway' 
                          ? 'border-yellow-500 bg-yellow-500/20' 
                          : 'border-yellow-500/30 hover:border-yellow-500/50'
                      }`}
                      data-testid="button-collection"
                    >
                      <Store className="h-6 w-6 text-yellow-400" />
                      <span className="text-white font-medium">Collection</span>
                    </button>
                    <button
                      onClick={() => setOrderType('delivery')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        orderType === 'delivery' 
                          ? 'border-yellow-500 bg-yellow-500/20' 
                          : 'border-yellow-500/30 hover:border-yellow-500/50'
                      }`}
                      data-testid="button-delivery"
                    >
                      <Truck className="h-6 w-6 text-yellow-400" />
                      <span className="text-white font-medium">Delivery</span>
                    </button>
                  </div>
                </div>
                
                {/* Customer Details */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-3">Your Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-yellow-100/70 text-sm mb-1 block">Name</label>
                      <Input 
                        placeholder="Enter your name"
                        value={bookingName}
                        onChange={(e) => setBookingName(e.target.value)}
                        className="bg-blue-800/50 border-yellow-500/30 text-white placeholder:text-yellow-100/40"
                        data-testid="input-checkout-name"
                      />
                    </div>
                    <div>
                      <label className="text-yellow-100/70 text-sm mb-1 block">Phone Number</label>
                      <Input 
                        placeholder="Enter your phone number"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="bg-blue-800/50 border-yellow-500/30 text-white placeholder:text-yellow-100/40"
                        data-testid="input-checkout-phone"
                      />
                    </div>
                    {orderType === 'delivery' && (
                      <div>
                        <label className="text-yellow-100/70 text-sm mb-1 block">Delivery Address</label>
                        <Input 
                          placeholder="Enter your full address"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="bg-blue-800/50 border-yellow-500/30 text-white placeholder:text-yellow-100/40"
                          data-testid="input-checkout-address"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Payment Method */}
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-3">Payment Method</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {orderType !== "delivery" && (
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        paymentMethod === 'cash' 
                          ? 'border-yellow-500 bg-yellow-500/20' 
                          : 'border-yellow-500/30 hover:border-yellow-500/50'
                      }`}
                      data-testid="button-pay-cash"
                    >
                      <Banknote className="h-6 w-6 text-yellow-400" />
                      <span className="text-white font-medium">Cash</span>
                    </button>
                    )}
                    {hasStripeKeys && (
                    <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'card' 
                            ? 'border-yellow-500 bg-yellow-500/20' 
                            : 'border-yellow-500/30 hover:border-yellow-500/50'
                        }`}
                        data-testid="button-pay-card"
                      >
                        <CreditCard className="h-6 w-6 text-yellow-400" />
                        <span className="text-white font-medium">Card</span>
                      </button>
                    )}
                    {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                    <button
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'bank_transfer' 
                            ? 'border-purple-500 bg-purple-500/20' 
                            : 'border-yellow-500/30 hover:border-yellow-500/50'
                        }`}
                        data-testid="button-pay-bank"
                      >
                        <Building className="h-6 w-6 text-purple-400" />
                        <span className="text-white font-medium">Bank</span>
                      </button>
                    )}
                  </div>
                </div>

                {paymentMethod === "bank_transfer" && (
                  <BankTransferQRSection
                    restaurant={restaurant}
                    total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                    currencySymbol={currencySymbol}
                  />
                )}
                
                {/* Order Summary */}
                {(() => {
                  const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                    const topping = activeToppings.find((t: ExtraTopping) => t.name === name);
                    return sum + (topping ? Number(topping.price) : 0);
                  }, 0);
                  const cutleryAmount = (addCutlery && restaurant?.cutleryOptionEnabled) ? Number((restaurant as any).cutleryPrice || 0.50) : 0;
                  const subtotalWithExtras = cartTotal + extrasTotal;
                  const deliveryFeeAmount = orderType === 'delivery' ? Number(restaurant?.deliveryFee || 2.50) : 0;
                  const vatAmount = restaurant?.vatEnabled ? subtotalWithExtras * Number(restaurant?.vatPercent || 20) / 100 : 0;
                  const grandTotal = subtotalWithExtras + deliveryFeeAmount + vatAmount + cutleryAmount;
                  
                  return (
                    <div className="pt-4 border-t border-yellow-500/20">
                      <h4 className="text-yellow-400 font-semibold mb-3">Order Summary</h4>
                      <div className="space-y-2">
                        {cart.map((item: CartItem) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-yellow-100/70">{item.quantity}x {item.name}</span>
                            <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        {tempSelectedExtras.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-100/70">Extras ({tempSelectedExtras.join(', ')})</span>
                            <span className="text-white">+{currencySymbol}{extrasTotal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-yellow-500/20 space-y-1">
                          {restaurant?.cutleryOptionEnabled && (
                            <div
                              className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                              style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                              onClick={() => setAddCutlery(!addCutlery)}
                              data-testid="button-add-cutlery"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                  {addCutlery && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                              </div>
                              <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-100/70">Subtotal:</span>
                            <span className="text-white">{currencySymbol}{subtotalWithExtras.toFixed(2)}</span>
                          </div>
                          {addCutlery && restaurant?.cutleryOptionEnabled && (
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                              <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                            </div>
                          )}
                          {orderType === 'delivery' && (
                            <div className="flex justify-between text-sm">
                              <span className="text-yellow-100/70">Delivery Fee:</span>
                              <span className="text-white">{currencySymbol}{deliveryFeeAmount.toFixed(2)}</span>
                            </div>
                          )}
                          {restaurant?.vatEnabled && (
                            <div className="flex justify-between text-sm">
                              <span className="text-yellow-100/70">VAT ({restaurant?.vatPercent || 20}%):</span>
                              <span className="text-white">{currencySymbol}{vatAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-yellow-500/20">
                            <span className="text-white font-semibold">Total:</span>
                            <span className="watford-gold-text text-lg font-bold">
                              {currencySymbol}{grandTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Place Order Button */}
              {(() => {
                const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                  const topping = activeToppings.find((t: ExtraTopping) => t.name === name);
                  return sum + (topping ? Number(topping.price) : 0);
                }, 0);
                const cutleryAmount = (addCutlery && restaurant?.cutleryOptionEnabled) ? Number((restaurant as any).cutleryPrice || 0.50) : 0;
                const subtotalWithExtras = cartTotal + extrasTotal;
                const deliveryFeeAmount = (orderType === 'delivery' && restaurant?.deliveryFeeEnabled) 
                  ? (restaurant?.freeDeliveryEnabled && subtotalWithExtras >= Number(restaurant?.freeDeliveryMinimum || 0) ? 0 : Number(restaurant?.deliveryFee || 0))
                  : 0;
                const vatAmount = restaurant?.vatEnabled ? subtotalWithExtras * Number(restaurant?.vatPercent || 20) / 100 : 0;
                const serviceFeeAmount = restaurant?.serviceFeeEnabled ? subtotalWithExtras * Number(restaurant?.serviceFeePercent || 0) / 100 : 0;
                const grandTotal = subtotalWithExtras + deliveryFeeAmount + vatAmount + serviceFeeAmount + cutleryAmount;
                
                return (
                  <div className="p-4 border-t border-yellow-500/30" style={{ background: 'rgba(15, 28, 46, 0.95)' }}>
                    <Button 
                      onClick={async () => {
                        if (!bookingName || !bookingPhone) {
                          toast({ title: "Please fill in your details", variant: "destructive" });
                          return;
                        }
                        if (orderType === 'delivery' && !bookingEmail) {
                          toast({ title: "Please enter your delivery address", variant: "destructive" });
                          return;
                        }
                        
                        try {
                          setIsProcessingPayment(true);
                          
                          const orderData = {
                            restaurantId: restaurant?.id!,
                            type: orderType as "takeaway" | "delivery" | "dine-in" | "collection",
                            status: 'new' as const,
                            customerName: bookingName,
                            phone: bookingPhone,
                            address: orderType === 'delivery' ? bookingEmail : undefined,
                            paymentMethod: paymentMethod,
                            subtotal: String(subtotalWithExtras),
                            deliveryFee: String(deliveryFee),
                            total: String(grandTotal),
                          };
                          
                          const orderItems = cart.map((item: CartItem, index: number) => ({
                            menuItemId: Number(item.id) || index + 1,
                            name: item.name + (item.extras && item.extras.length > 0 ? ` (+ ${item.extras.join(', ')})` : ''),
                            quantity: item.quantity,
                            price: String(Number(item.price) * item.quantity),
                            notes: item.removedIngredients && item.removedIngredients.length > 0 ? `Remove: ${item.removedIngredients.join(', ')}` : null,
                          }));
                          
                          if (tempSelectedExtras.length > 0) {
                            orderItems.push({
                              menuItemId: 0,
                              name: `Order Extras: ${tempSelectedExtras.join(', ')}`,
                              quantity: 1,
                              price: String(extrasTotal),
                              notes: 'Additional order extras',
                            });
                          }
                          
                          if (addCutlery && restaurant?.cutleryOptionEnabled) {
                            orderItems.push({
                              menuItemId: 0,
                              name: (restaurant as any).cutleryName || "Cutlery Set",
                              quantity: 1,
                              price: String(Number((restaurant as any).cutleryPrice || 0.50)),
                              notes: null,
                            });
                          }
                          
                          await createOrder(orderData, orderItems);
                          
                          setIsProcessingPayment(false);
                          setIsCheckoutOpen(false);
                          setCart([]);
                          setAddCutlery(false);
                          setTempSelectedExtras([]);
                          setBookingName('');
                          setBookingPhone('');
                          setBookingEmail('');
                          
                          toast({
                            title: "Order Placed Successfully! 🎉",
                            description: `Your ${orderType === 'delivery' ? 'delivery' : 'collection'} order has been received. ${paymentMethod === 'cash' ? 'Please pay on ' + (orderType === 'delivery' ? 'delivery' : 'collection') + '.' : 'Payment confirmed.'}`,
                          });
                        } catch (error) {
                          setIsProcessingPayment(false);
                          toast({ title: "Failed to place order", description: "Please try again", variant: "destructive" });
                        }
                      }}
                      disabled={isProcessingPayment || !bookingName || !bookingPhone || (orderType === 'delivery' && !bookingEmail)}
                      className="w-full py-6 text-lg font-bold text-blue-900 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #c9a646 0%, #f4d678 100%)' }}
                      data-testid="button-place-order-watford"
                    >
                      {isProcessingPayment ? 'Processing...' : `Place Order - ${currencySymbol}${grandTotal.toFixed(2)}`}
                    </Button>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Booking Dialog */}
          <Dialog open={showBooking} onOpenChange={setShowBooking}>
            <DialogContent className="bg-blue-900 border-yellow-500/30 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="watford-gold-text text-xl">Book a Table</DialogTitle>
              </DialogHeader>
              <p className="text-yellow-100/70 text-sm">Table booking coming soon for {restaurant.name}</p>
            </DialogContent>
          </Dialog>

          {/* Login Dialog */}
          <Dialog open={showLogin} onOpenChange={setShowLogin}>
            <DialogContent className="bg-blue-900 border-yellow-500/30 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="watford-gold-text text-xl">Sign In</DialogTitle>
              </DialogHeader>
              <p className="text-yellow-100/70 text-sm">Login feature coming soon</p>
            </DialogContent>
          </Dialog>

          {/* Item Options Dialog */}
          <Dialog open={!!itemWithOptionsDialog} onOpenChange={(open) => !open && setItemWithOptionsDialog(null)}>
            <DialogContent className="bg-blue-900 border-yellow-500/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
              {itemWithOptionsDialog && (
                <div>
                  <DialogHeader>
                    <DialogTitle className="watford-gold-text text-xl">{itemWithOptionsDialog.name}</DialogTitle>
                  </DialogHeader>
                  {itemWithOptionsDialog.image && (
                    <img 
                      src={itemWithOptionsDialog.image} 
                      alt={itemWithOptionsDialog.name}
                      className="w-full h-40 object-cover rounded-lg my-4"
                    />
                  )}
                  <p className="text-yellow-100/70 text-sm mb-4">{itemWithOptionsDialog.description}</p>
                  
                  <div className="mt-5 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setItemWithOptionsDialog(null)}
                      className="flex-1 border-yellow-500/30 text-white hover:bg-blue-800/50 rounded-full py-5 font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => itemWithOptionsDialog && addToCartWithOptions(itemWithOptionsDialog)}
                      className="flex-1 text-blue-900 rounded-full py-5 font-semibold shadow-lg hover:shadow-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #c9a646 0%, #f4d678 100%)' }}
                      data-testid="button-add-with-options-watford"
                    >
                      Add to Basket
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : isTawaTheme ? (
        <>
          {/* Tawa Hero Banner */}
          <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
            {restaurant?.tawaHeroVideo ? (
              <video 
                src={restaurant.tawaHeroVideo}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : restaurant?.tawaHeroImage ? (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${restaurant.tawaHeroImage}')` }}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url('https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1600&h=600&fit=crop')`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-10 max-w-xl">
                <p className="text-orange-400 text-lg sm:text-xl italic font-light mb-1">Delicious</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-orange-500 leading-tight">
                  SPECIAL<br/>MENU
                </h2>
                <p className="text-white/80 text-sm sm:text-base mt-2 italic">Tasty Special Menu</p>
                <button 
                  onClick={() => scrollToCategory(availableCategories[0]?.id || '')}
                  className="mt-4 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-md transition-all shadow-lg"
                  data-testid="button-order-now-tawa"
                >
                  Order Now
                </button>
                <div className="mt-4 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-lg">📞</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tawa Header Bar - Sticky */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            {/* Orange Top Bar */}
            <div style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)' }} className="py-3 px-4">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                {/* Logo & Name */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xl">🔥</span>
                  </div>
                  <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">{restaurant.name}</h1>
                </div>
                
                {/* Search Box - Hidden on mobile */}
                <div className="hidden sm:block flex-1 max-w-md mx-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search Menu"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-0 rounded-full bg-white focus:ring-2 focus:ring-orange-300"
                      data-testid="input-search-tawa"
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => navigate(welcomeUrl)}
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white border border-white/50 rounded-full hover:bg-white/10 transition-all"
                    data-testid="button-about-tawa"
                  >
                    About
                  </button>
                  <button 
                    onClick={() => openBooking()}
                    className="px-4 py-2 text-sm font-medium text-white border border-white/50 rounded-full hover:bg-white/10 transition-all"
                    data-testid="button-booking-tawa"
                  >
                    Booking
                  </button>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="hidden sm:block px-4 py-2 text-sm font-medium text-white border border-white/50 rounded-full hover:bg-white/10 transition-all"
                    data-testid="button-login-tawa"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={() => setShowAllergenMatrix(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-orange-500 hover:bg-orange-50 transition-all"
                    data-testid="button-allergen-tawa"
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </button>
                  {showInstallButton && !isPWAInstalled && (
                    <button 
                      onClick={handleInstallClick}
                      className="px-4 py-2 text-sm font-bold text-orange-500 bg-white rounded-full hover:bg-orange-50 transition-all flex items-center gap-2 shadow-lg animate-pulse"
                      data-testid="button-install-app-tawa"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Install App</span>
                      <span className="sm:hidden">Install</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Search - Show below orange bar on mobile */}
            <div className="sm:hidden px-4 py-2 bg-slate-800 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Menu"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-600 rounded-full bg-slate-700 text-white text-sm h-10 placeholder:text-gray-400"
                  data-testid="input-search-tawa-mobile"
                />
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="bg-slate-800 border-t border-slate-700">
              <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center gap-2 py-2">
                  {/* Left Arrow */}
                  <button 
                    onClick={() => scrollCategories('left')}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-slate-600 hover:bg-slate-700 bg-slate-700 shadow-sm"
                    data-testid="button-category-left-tawa"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-300" />
                  </button>
                  
                  {/* Scrollable Categories */}
                  <div 
                    ref={categoryScrollRef}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex items-center gap-1 min-w-max">
                      {availableCategories.map((category, index) => (
                        <motion.button
                          key={category.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => {
                            setActiveCategoryId(category.id);
                            const element = document.getElementById(`tawa-category-${category.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className={`px-4 py-2 text-sm font-medium rounded-sm transition-all whitespace-nowrap ${
                            activeCategoryId === category.id
                              ? 'text-orange-400 border-b-2 border-orange-500'
                              : 'text-gray-300 hover:text-orange-400'
                          }`}
                          data-testid={`tab-tawa-${category.id}`}
                        >
                          {category.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Arrow */}
                  <button 
                    onClick={() => scrollCategories('right')}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-slate-600 hover:bg-slate-700 bg-slate-700 shadow-sm"
                    data-testid="button-category-right-tawa"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </header>
          
          {/* Tawa Menu Content */}
          <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 bg-gradient-to-b from-slate-900 to-slate-800 min-h-screen">
            {availableCategories.map((category) => {
              const categoryItems = getItemsByCategory(category.id);
              if (categoryItems.length === 0) return null;
              
              return (
                <motion.section 
                  key={category.id}
                  id={`tawa-category-${category.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 scroll-mt-32"
                >
                  {/* Category Header with Unique Colors */}
                  {(() => {
                    const catIndex = availableCategories.findIndex(c => c.id === category.id);
                    const categoryColors = [
                      { bg: 'from-green-500 to-emerald-600', text: 'text-green-400', badge: 'bg-green-900/50 text-green-300' },
                      { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-400', badge: 'bg-blue-900/50 text-blue-300' },
                      { bg: 'from-purple-500 to-violet-600', text: 'text-purple-400', badge: 'bg-purple-900/50 text-purple-300' },
                      { bg: 'from-orange-500 to-red-500', text: 'text-orange-400', badge: 'bg-orange-900/50 text-orange-300' },
                      { bg: 'from-pink-500 to-rose-600', text: 'text-pink-400', badge: 'bg-pink-900/50 text-pink-300' },
                      { bg: 'from-teal-500 to-cyan-600', text: 'text-teal-400', badge: 'bg-teal-900/50 text-teal-300' },
                      { bg: 'from-amber-500 to-yellow-600', text: 'text-amber-400', badge: 'bg-amber-900/50 text-amber-300' },
                      { bg: 'from-red-500 to-rose-600', text: 'text-red-400', badge: 'bg-red-900/50 text-red-300' },
                      { bg: 'from-indigo-500 to-blue-600', text: 'text-indigo-400', badge: 'bg-indigo-900/50 text-indigo-300' },
                      { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-400', badge: 'bg-emerald-900/50 text-emerald-300' },
                    ];
                    const colorScheme = categoryColors[catIndex % categoryColors.length];
                    return (
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${colorScheme.bg}`}></div>
                        <h2 className={`text-lg font-bold ${colorScheme.text}`}>{category.name}</h2>
                        <div className={`h-px flex-1 bg-gradient-to-r ${colorScheme.bg} opacity-30`}></div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorScheme.badge}`}>{categoryItems.length}</span>
                      </div>
                    );
                  })()}
                  
                  {/* Mobile: Horizontal Scroll | Desktop: Grid 5 columns */}
                  {(() => {
                    const catIdx = availableCategories.findIndex(c => c.id === category.id);
                    const btnColors = [
                      'bg-green-600 hover:bg-green-700',
                      'bg-blue-600 hover:bg-blue-700',
                      'bg-purple-600 hover:bg-purple-700',
                      'bg-orange-600 hover:bg-orange-700',
                      'bg-pink-600 hover:bg-pink-700',
                      'bg-teal-600 hover:bg-teal-700',
                      'bg-amber-600 hover:bg-amber-700',
                      'bg-red-600 hover:bg-red-700',
                      'bg-indigo-600 hover:bg-indigo-700',
                      'bg-emerald-600 hover:bg-emerald-700',
                    ];
                    const priceColors = [
                      'text-green-600', 'text-blue-600', 'text-purple-600', 'text-orange-600', 'text-pink-600',
                      'text-teal-600', 'text-amber-600', 'text-red-600', 'text-indigo-600', 'text-emerald-600'
                    ];
                    const borderColors = [
                      'border-green-200', 'border-blue-200', 'border-purple-200', 'border-orange-200', 'border-pink-200',
                      'border-teal-200', 'border-amber-200', 'border-red-200', 'border-indigo-200', 'border-emerald-200'
                    ];
                    const btnColor = btnColors[catIdx % btnColors.length];
                    const priceColor = priceColors[catIdx % priceColors.length];
                    const borderColor = borderColors[catIdx % borderColors.length];
                    
                    return (
                  <div className="md:hidden overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-3 px-1" style={{ minWidth: 'max-content' }}>
                      {categoryItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`w-[130px] flex-shrink-0 bg-slate-800 rounded-xl overflow-hidden shadow-md border-2 ${borderColor} ${item.available === false ? 'opacity-60' : ''}`}
                          data-testid={`menu-item-mobile-${item.id}`}
                        >
                          {/* Image/Video/GIF */}
                          <div className="aspect-square relative overflow-hidden bg-slate-700">
                            {item.videoUrl ? (
                              <video 
                                src={item.videoUrl}
                                className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                autoPlay loop muted playsInline
                              />
                            ) : (item as any).gifUrl ? (
                              <img src={(item as any).gifUrl} alt={item.name} className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`} />
                            ) : (
                              <img src={item.image || getItemImage(category.id, idx)} alt={item.name} className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`} />
                            )}
                            {item.available === false && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-red-500 font-bold text-xs bg-white/90 px-2 py-0.5 rounded">SOLD OUT</span>
                              </div>
                            )}
                            {/* Quick Add Button */}
                            {item.available !== false && (!item.variants || item.variants.length === 0) && (
                              <button
                                onClick={() => { playClick(); addToCart(item); }}
                                className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full ${btnColor} text-white flex items-center justify-center shadow-lg`}
                                data-testid={`quick-add-mobile-${item.id}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-[11px] font-medium text-white line-clamp-2 leading-tight">{item.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-sm font-bold ${priceColor}`}>{currencySymbol}{Number(item.price).toFixed(2)}</span>
                              {(item as any).weight && (
                                <span className="text-[9px] text-gray-400">{(item as any).weight}kg</span>
                              )}
                            </div>
                            {/* Weight Dropdown for Mobile */}
                            {item.variants && item.variants.length > 0 && (item as any).variantLabel && item.available !== false && (
                              <div className="mt-1.5 space-y-1">
                                <select
                                  value={selectedVariants[item.id] || ''}
                                  onChange={(e) => setSelectedVariants(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className={`w-full text-[10px] border ${borderColor} rounded px-1.5 py-1 bg-slate-700 text-white`}
                                  data-testid={`select-mobile-${item.id}`}
                                >
                                  <option value="">Select</option>
                                  {item.variants.filter((v: any) => v.available !== false).map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => {
                                    const vid = selectedVariants[item.id];
                                    if (vid) {
                                      const variant = item.variants!.find((v: any) => v.id === vid);
                                      if (variant) { playClick(); addVariantToCart(item, variant); }
                                    }
                                  }}
                                  disabled={!selectedVariants[item.id]}
                                  className={`w-full text-[10px] py-1.5 rounded ${btnColor} text-white font-medium disabled:opacity-50`}
                                >
                                  ADD
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                    );
                  })()}
                  
                  {/* Desktop: Grid Layout - 5 items per row with category colors */}
                  {(() => {
                    const catIdx = availableCategories.findIndex(c => c.id === category.id);
                    const btnColors = [
                      'bg-green-600 hover:bg-green-700', 'bg-blue-600 hover:bg-blue-700', 'bg-purple-600 hover:bg-purple-700',
                      'bg-orange-600 hover:bg-orange-700', 'bg-pink-600 hover:bg-pink-700', 'bg-teal-600 hover:bg-teal-700',
                      'bg-amber-600 hover:bg-amber-700', 'bg-red-600 hover:bg-red-700', 'bg-indigo-600 hover:bg-indigo-700', 'bg-emerald-600 hover:bg-emerald-700'
                    ];
                    const priceColors = ['text-green-600', 'text-blue-600', 'text-purple-600', 'text-orange-600', 'text-pink-600', 'text-teal-600', 'text-amber-600', 'text-red-600', 'text-indigo-600', 'text-emerald-600'];
                    const borderColors = ['border-green-200', 'border-blue-200', 'border-purple-200', 'border-orange-200', 'border-pink-200', 'border-teal-200', 'border-amber-200', 'border-red-200', 'border-indigo-200', 'border-emerald-200'];
                    const btnColor = btnColors[catIdx % btnColors.length];
                    const priceColor = priceColors[catIdx % priceColors.length];
                    const borderColor = borderColors[catIdx % borderColors.length];
                    
                    return (
                  <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {categoryItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={item.available !== false ? { y: -3, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' } : {}}
                        className={`bg-slate-800 rounded-xl overflow-hidden shadow-sm border-2 ${borderColor} group transition-all duration-200 ${item.available === false ? 'opacity-60' : ''}`}
                        data-testid={`menu-item-desktop-${item.id}`}
                      >
                        {/* Image/Video/GIF */}
                        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                          {item.videoUrl ? (
                            <video 
                              src={item.videoUrl}
                              className={`w-full h-full object-cover transition-transform duration-300 ${item.available === false ? 'grayscale' : 'group-hover:scale-105'}`}
                              autoPlay loop muted playsInline
                            />
                          ) : (item as any).gifUrl ? (
                            <img 
                              src={(item as any).gifUrl}
                              alt={item.name}
                              className={`w-full h-full object-cover transition-transform duration-300 ${item.available === false ? 'grayscale' : 'group-hover:scale-105'}`}
                            />
                          ) : (
                            <img 
                              src={item.image || getItemImage(category.id, idx)}
                              alt={item.name}
                              className={`w-full h-full object-cover transition-transform duration-300 ${item.available === false ? 'grayscale' : 'group-hover:scale-105'}`}
                            />
                          )}
                          {item.available === false && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-red-500 font-bold text-xs bg-white/90 px-2 py-1 rounded">SOLD OUT</span>
                            </div>
                          )}
                          {/* Quick Add Button */}
                          {item.available !== false && (!item.variants || item.variants.length === 0) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); playClick(); addToCart(item); }}
                              className={`absolute bottom-2 right-2 w-8 h-8 rounded-full ${btnColor} text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100`}
                              data-testid={`quick-add-desktop-${item.id}`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        
                        {/* Item Info */}
                        <div className="p-2.5">
                          <h3 className={`text-xs font-medium line-clamp-2 leading-tight ${item.available === false ? 'text-gray-500' : 'text-white'}`}>{item.name}</h3>
                          
                          {/* Price & Weight Row */}
                          <div className="flex items-center justify-between mt-1.5">
                            <span className={`text-sm font-bold ${priceColor}`}>{currencySymbol}{Number(item.price).toFixed(2)}</span>
                            {(item as any).weight && (
                              <span className="text-[10px] text-gray-400 bg-slate-700 px-1.5 py-0.5 rounded">{(item as any).weight}kg</span>
                            )}
                          </div>
                          
                          {/* Variant Dropdown (for weight options) */}
                          {item.variants && item.variants.length > 0 && item.available !== false && (item as any).variantLabel && (
                            <div className="mt-2 space-y-1.5">
                              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{(item as any).variantLabel}</label>
                              <select
                                value={selectedVariants[item.id] || ''}
                                onChange={(e) => setSelectedVariants(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className={`w-full text-xs border ${borderColor} rounded-lg px-2 py-1.5 bg-slate-700 text-white`}
                                data-testid={`select-variant-desktop-${item.id}`}
                              >
                                <option value="">-- Select --</option>
                                {item.variants.filter((v: any) => v.available !== false).map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.name} - {currencySymbol}{variant.price}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const variantId = selectedVariants[item.id];
                                  if (variantId) {
                                    const variant = item.variants!.find((v: any) => v.id === variantId);
                                    if (variant) { playClick(); addVariantToCart(item, variant); }
                                  }
                                }}
                                disabled={!selectedVariants[item.id]}
                                className={`w-full text-xs px-3 py-2 rounded ${btnColor} text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors`}
                                data-testid={`add-to-cart-${item.id}`}
                              >
                                <ShoppingCart className="h-3 w-3" />
                                ADD TO CART
                              </button>
                            </div>
                          )}
                          
                          {/* Standard Variant Buttons - Compact Style */}
                          {item.variants && item.variants.length > 0 && item.available !== false && !(item as any).variantLabel && (
                            <div className="mt-2 space-y-0.5">
                              {item.variants.slice(0, 3).map((variant) => (
                                (variant as any).available === false ? (
                                  <div
                                    key={variant.id}
                                    className="flex items-center justify-between w-full text-[10px] px-1.5 py-0.5 rounded bg-red-900/30"
                                  >
                                    <span className="text-gray-500 line-through truncate">{variant.name}</span>
                                    <span className="text-red-400 text-[9px] font-bold">OUT</span>
                                  </div>
                                ) : (
                                  <button
                                    key={variant.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playClick();
                                      addVariantToCart(item, variant);
                                    }}
                                    className={`flex items-center justify-between w-full text-[10px] px-1.5 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors group/btn`}
                                    data-testid={`add-variant-${variant.id}`}
                                  >
                                    <span className="text-gray-300 truncate">{variant.name}</span>
                                    <div className="flex items-center gap-1">
                                      <span className={`${priceColor} font-bold`}>{currencySymbol}{variant.price}</span>
                                      <Plus className={`h-3 w-3 ${priceColor} opacity-0 group-hover/btn:opacity-100`} />
                                    </div>
                                  </button>
                                )
                              ))}
                              {item.variants.length > 3 && (
                                <span className="text-[9px] text-gray-500">+{item.variants.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                    );
                  })()}
                </motion.section>
              );
            })}
          </main>

          {/* Beautiful Floating Cart Button */}
          {cart.length > 0 && !isCartOpen && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
              <Button 
                onClick={() => setIsCartOpen(true)}
                className="w-full h-14 rounded-2xl shadow-2xl text-white flex justify-between items-center px-5 transition-all hover:scale-[1.02] border border-white/20"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)' }}
                data-testid="button-view-basket"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg">
                    {cartCount}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-base block">Your Basket</span>
                    <span className="text-white/70 text-xs">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xl block">{currencySymbol}{cartTotal.toFixed(2)}</span>
                  <span className="text-white/70 text-xs">View &rarr;</span>
                </div>
              </Button>
            </div>
          )}

          {/* Tawa Grill Extras Dialog */}
          <Dialog open={showTawaExtras} onOpenChange={(open) => { setShowTawaExtras(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1010 50%, #3d1515 100%)', border: '2px solid rgba(249, 115, 22, 0.3)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold" style={{ color: '#f97316' }}>Add Extras to Your Order?</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Select any extras you'd like to add</p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        tempSelectedExtras.includes(topping.name)
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-orange-500/30 hover:border-orange-500/50'
                      }`}
                    >
                      <p className="font-medium text-sm text-white">{topping.name}</p>
                      <p className="text-xs mt-1 text-orange-400">+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {tempSelectedExtras.length > 0 && (
                <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(249, 115, 22, 0.3)', background: 'rgba(249, 115, 22, 0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="font-bold text-orange-400">
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowTawaExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 border-orange-500/30 text-white hover:bg-orange-500/10"
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    setShowTawaExtras(false);
                    setIsCartOpen(true);
                  }}
                  className="flex-1 font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : isEmparoTheme ? (
        <>
          {/* EMPARO Mobile Sidebar - Dark Navy */}
          {showEmparoSidebar && (
            <div className="fixed inset-0 z-[100]">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowEmparoSidebar(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0a1628] shadow-2xl overflow-y-auto border-r border-white/10">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  {restaurant.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant.name} className="h-12 object-contain" />
                  )}
                  <button onClick={() => setShowEmparoSidebar(false)} className="text-white/70 p-2 hover:bg-white/10 rounded-full">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <button onClick={() => { setEmparoShowWelcome(true); setEmparoSelectedCategory(null); setEmparoSelectedVariation(null); setSearchQuery(''); setShowSearch(false); window.scrollTo({ top: 0, behavior: 'smooth' }); setShowEmparoSidebar(false); }} className="w-full text-left px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">🏠</span> Welcome
                  </button>
                  <button onClick={() => { setEmparoShowWelcome(false); if (!emparoSelectedCategory) setEmparoSelectedCategory(availableCategories[0]?.id || null); setShowEmparoSidebar(false); setTimeout(() => document.getElementById('emparo-menu-section')?.scrollIntoView({ behavior: 'smooth' }), 50); }} className="w-full text-left px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">🍗</span> Order Now
                  </button>
                  <button onClick={() => { document.getElementById('emparo-contact')?.scrollIntoView({ behavior: 'smooth' }); setShowEmparoSidebar(false); }} className="w-full text-left px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">📞</span> Contact
                  </button>
                  <button onClick={() => { playClick(); setShowAllergenMatrix(true); setShowEmparoSidebar(false); }} className="w-full text-left px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">⚠️</span> Allergens
                  </button>
                  <button onClick={() => { playClick(); setShowLogin(true); setShowEmparoSidebar(false); }} className="w-full text-left px-4 py-3 text-white/80 font-medium hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><User className="h-4 w-4" /></span> {currentCustomer ? currentCustomer.name || "Account" : "Log In"}
                  </button>
                </div>
                <div className="p-4 border-t border-white/10 mt-2">
                  <p className="text-white/40 text-[10px] font-bold tracking-widest mb-3 px-2">CATEGORIES</p>
                  <div className="space-y-0.5">
                    {availableCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => { 
                          setEmparoShowWelcome(false);
                          setEmparoSelectedCategory(category.id); 
                          setEmparoSelectedVariation(null);
                          setEmparoQuantity(1);
                          setTimeout(() => document.getElementById('emparo-menu-section')?.scrollIntoView({ behavior: 'smooth' }), 50); 
                          setShowEmparoSidebar(false); 
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                          emparoSelectedCategory === category.id 
                            ? 'bg-[#C41E3A] text-white font-semibold' 
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EMPARO Top Bar */}
          <div className="sticky top-0 z-50 bg-[#0a1628]/95 backdrop-blur-sm border-b border-white/[0.06]">
            <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowEmparoSidebar(true)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  data-testid="button-hamburger-emparo"
                >
                  <Menu className="h-5 w-5" />
                </button>
                {restaurant.logoUrl && (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="h-7 sm:h-9 object-contain" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => { playClick(); setEmparoShowWelcome(true); setEmparoSelectedCategory(null); setEmparoSelectedVariation(null); setSearchQuery(''); setShowSearch(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-full transition-all ${emparoShowWelcome ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'}`}
                  data-testid="button-back-welcome"
                >
                  Welcome
                </button>
                <button 
                  onClick={() => { 
                    playClick(); 
                    setEmparoShowWelcome(false);
                    if (!emparoSelectedCategory) setEmparoSelectedCategory(availableCategories[0]?.id || null);
                    setTimeout(() => document.getElementById('emparo-menu-section')?.scrollIntoView({ behavior: 'smooth' }), 50);
                  }}
                  className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-full transition-all ${!emparoShowWelcome ? 'bg-white text-[#0a1628]' : 'bg-white/20 text-white/70 hover:bg-white/30'}`}
                  data-testid="button-online-order-emparo"
                >
                  Order Now
                </button>
                <button 
                  onClick={() => { playClick(); openBooking(); }}
                  className="hidden sm:block px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-full border border-white/15 text-white/50 hover:text-white/80 transition-all"
                  data-testid="button-book-table-emparo"
                >
                  Book Table
                </button>
                <button 
                  onClick={() => { playClick(); setShowAllergenMatrix(true); }}
                  className="hidden sm:block px-3 py-1.5 text-[10px] sm:text-xs font-semibold rounded-full border border-white/15 text-white/50 hover:text-white/80 transition-all"
                  data-testid="button-allergen-nav"
                >
                  Allergens
                </button>
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
                {showInstallButton && !isPWAInstalled && (
                  <button 
                    onClick={handleInstallClick}
                    className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    data-testid="button-install-app-emparo"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative"
                  data-testid="button-cart-emparo-mobile"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#C41E3A] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{cart.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* EMPARO Main Content - Dark Navy Background Throughout */}
          <div className="bg-[#0d1b2a] min-h-screen">
            {emparoShowWelcome ? (
            <div className="bg-[#0a1628]">
              <div className="px-4 pt-8 sm:pt-10 pb-4">
                <div className="max-w-5xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.6 }}
                    className="text-center mb-6"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                      <span className="text-white/50 text-[10px] font-bold tracking-[0.15em] uppercase">Flame Grilled Peri Peri</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">
                      {restaurant?.name || 'Emparo Peri Peri Finsbury Park'}
                    </h1>
                    <p className="text-white/30 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                      {restaurant?.description || 'Authentic flame-grilled peri peri chicken crafted with the finest ingredients and bold flavors'}
                    </p>
                  </motion.div>

                </div>
              </div>

              {/* Animated Food Image Slider */}
              <div className="relative pb-5">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10" style={{ background: 'linear-gradient(to right, #0a1628, transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10" style={{ background: 'linear-gradient(to left, #0a1628, transparent)' }} />
                <motion.div
                  className="flex gap-3 sm:gap-4"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: 30, ease: 'linear' } }}
                  style={{ width: 'max-content' }}
                >
                  {[
                    { src: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=280&fit=crop', label: 'Grilled Chicken' },
                    { src: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=280&fit=crop', label: 'Peri Peri Wings' },
                    { src: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=280&fit=crop', label: 'Spicy Platter' },
                    { src: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=280&fit=crop', label: 'Flame Grilled' },
                    { src: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=280&fit=crop', label: 'Fresh Burgers' },
                    { src: 'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400&h=280&fit=crop', label: 'Special Wraps' },
                    { src: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=280&fit=crop', label: 'Grilled Chicken' },
                    { src: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=280&fit=crop', label: 'Peri Peri Wings' },
                    { src: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=280&fit=crop', label: 'Spicy Platter' },
                    { src: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=280&fit=crop', label: 'Flame Grilled' },
                    { src: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=280&fit=crop', label: 'Fresh Burgers' },
                    { src: 'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=400&h=280&fit=crop', label: 'Special Wraps' },
                  ].map((item, i) => (
                    <div key={i} className="flex-shrink-0 w-48 sm:w-56 group/slide">
                      <div className="relative h-32 sm:h-36 rounded-xl overflow-hidden border border-white/[0.06]">
                        <img src={item.src} alt={item.label} className="w-full h-full object-cover transition-transform duration-500 group-hover/slide:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/80">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Info Strip */}
              <div className="border-t border-white/[0.04] px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-center gap-6 sm:gap-8">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-400/60" />
                    <span className="text-white/20 text-[9px] sm:text-[10px] font-medium tracking-wide uppercase">Halal</span>
                  </div>
                  <div className="w-px h-3 bg-white/[0.06]" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-white/20 text-[9px] sm:text-[10px] font-medium tracking-wide uppercase">Fresh Daily</span>
                  </div>
                  <div className="w-px h-3 bg-white/[0.06]" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-sky-400/60" />
                    <span className="text-white/20 text-[9px] sm:text-[10px] font-medium tracking-wide uppercase">Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
            ) : (
            <>
            {/* Search Bar */}
            {showSearch && (
              <div className="px-4 py-3 bg-[#0a1628] border-b border-white/5">
                <div className="max-w-5xl mx-auto">
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#C41E3A]"
                    data-testid="input-search-emparo"
                  />
                </div>
              </div>
            )}

            {/* Mobile Category Sidebar - Fixed Left - Only show in menu view */}
            <div 
              className="lg:hidden fixed left-0 top-[52px] z-40 w-[72px] bg-[#060e1a]/95 backdrop-blur-sm border-r border-white/[0.06]"
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', height: 'calc(100vh - 52px)', scrollbarWidth: 'none' }}
            >
              <div className="py-1.5 pb-[100px] px-1 space-y-[2px]">
                {availableCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setEmparoSelectedCategory(category.id);
                      setEmparoSelectedVariation(null);
                      setEmparoQuantity(1);
                    }}
                    className={`w-full text-center px-1 py-2 text-[8px] font-bold rounded-md transition-all leading-[1.2] uppercase tracking-wide ${
                      emparoSelectedCategory === category.id 
                        ? 'bg-[#C41E3A] text-white' 
                        : 'text-white/45 hover:bg-white/5 hover:text-white/70'
                    }`}
                    data-testid={`tab-emparo-mobile-${category.id}`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Section */}
            <section id="emparo-menu-section" className="py-4 px-3 lg:px-4 pl-[80px] lg:pl-4">
              <div className="max-w-5xl mx-auto flex gap-6">
                {/* Desktop Category Sidebar */}
                <div className="hidden lg:block w-52 shrink-0">
                  <div className="sticky top-16 bg-[#0a1628] rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-white/40 text-[10px] font-bold tracking-widest">CATEGORIES</p>
                    </div>
                    <div className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C41E3A33 transparent' }}>
                      {availableCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setEmparoSelectedCategory(category.id);
                            setEmparoSelectedVariation(null);
                            setEmparoQuantity(1);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                            emparoSelectedCategory === category.id 
                              ? 'bg-[#C41E3A] text-white' 
                              : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                          }`}
                          data-testid={`tab-emparo-${category.id}`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Menu Content Area */}
                <div className="flex-1 min-w-0">


                  {/* Search Results */}
                  {searchQuery && showSearch ? (
                    <div>
                      <div className="bg-[#0a1628] rounded-t-xl px-5 py-3 border border-white/10 border-b-0">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                          Results for "{searchQuery}"
                        </h3>
                      </div>
                      <div className="bg-[#111d2e] rounded-b-xl border border-white/10 border-t-0 p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {menuItemsWithVariants
                            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((item, idx) => (
                              <div
                                key={item.id}
                                onClick={() => { setEmparoSelectedVariation(item); setEmparoQuantity(1); }}
                                className={`bg-[#0a1628] rounded-xl p-4 cursor-pointer transition-all border ${
                                  emparoSelectedVariation?.id === item.id
                                    ? 'border-[#C41E3A] ring-1 ring-[#C41E3A]/50'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                                data-testid={`search-result-${item.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-semibold text-white text-sm">{item.name}</h5>
                                  {(!item.variants || item.variants.length === 0) && (
                                    <span className="font-bold text-[#C41E3A] whitespace-nowrap text-sm">
                                      {currencySymbol}{Number(item.price).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{item.description}</p>
                                )}
                                {item.variants && item.variants.length > 0 && (
                                  <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                                    {item.variants.map((variant) => (
                                      <div key={variant.id} className="flex items-center justify-between text-xs">
                                        <span className="text-white/60">{variant.name}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-[#C41E3A]">{currencySymbol}{variant.price}</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); addVariantToCart(item, variant); setEmparoQuantity(1); }}
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-white bg-[#C41E3A] transition-all hover:scale-110"
                                            data-testid={`add-search-variant-${variant.id}`}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                        {menuItemsWithVariants.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="text-center py-8 text-white/40 text-sm">No items found matching "{searchQuery}"</div>
                        )}
                      </div>
                    </div>
                  ) : emparoSelectedCategory ? (() => {
                    return (
                    <div>
                      {/* Category Header */}
                      <div className="bg-[#0a1628] rounded-t-xl px-5 py-3 border border-white/10 border-b-0 flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                          {availableCategories.find(c => c.id === emparoSelectedCategory)?.name || 'Menu'}
                        </h3>
                        <span className="text-white/30 text-[10px]">
                          {getItemsByCategory(emparoSelectedCategory).length} items
                        </span>
                      </div>

                      {/* Items List - Landscape Cards */}
                      <div className="bg-[#111d2e] rounded-b-xl border border-white/10 border-t-0 p-3 space-y-2">
                        {getItemsByCategory(emparoSelectedCategory).map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                            className="bg-[#0a1628] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all"
                            data-testid={`variation-card-${item.id}`}
                          >
                            <div className="flex">
                              {(item.image || item.videoUrl || item.gifUrl) && (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden">
                                  {item.videoUrl ? (
                                    <video src={item.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline poster={item.image} />
                                  ) : item.gifUrl ? (
                                    <img src={item.gifUrl} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                <div>
                                  <h5 className="font-semibold text-white text-sm leading-tight">{item.name}</h5>
                                  {item.description && (
                                    <p className="text-[10px] text-white/35 mt-0.5 line-clamp-2">{item.description}</p>
                                  )}
                                </div>
                                {(!item.variants || item.variants.length === 0) && (
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-white text-sm">{currencySymbol}{Number(item.price).toFixed(2)}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-[#C41E3A] transition-all"
                                      data-testid={`add-item-emparo-${item.id}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {item.variants && item.variants.length > 0 && (
                              <div className="px-3 pb-3 space-y-1 border-t border-white/[0.06] pt-2 ml-24 sm:ml-28">
                                {item.variants.map((variant) => (
                                  <div key={variant.id} className={`flex items-center justify-between ${(variant as any).available === false ? 'opacity-40' : ''}`}>
                                    <span className={`text-xs ${(variant as any).available === false ? 'text-white/30 line-through' : 'text-white/50'}`}>{variant.name}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold text-xs ${(variant as any).available === false ? 'text-white/30' : 'text-white/70'}`}>
                                        {currencySymbol}{variant.price}
                                      </span>
                                      {(variant as any).available === false ? (
                                        <span className="text-red-400 text-[9px] font-bold">SOLD OUT</span>
                                      ) : (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); addVariantToCart(item, variant); }}
                                          className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-[#C41E3A] transition-all"
                                          data-testid={`add-variant-emparo-${variant.id}`}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    );
                  })() : (
                    /* All Categories View - Landscape Cards */
                    <div className="space-y-4">
                      {availableCategories.map(category => {
                        const items = getItemsByCategory(category.id);
                        if (items.length === 0) return null;
                        return (
                          <div key={category.id} id={`category-${category.id}`} className="scroll-mt-20">
                            <div 
                              className="bg-[#0a1628] text-white px-5 py-3 rounded-t-xl cursor-pointer hover:bg-[#0f2035] transition-colors border border-white/10 border-b-0"
                              onClick={() => { setEmparoSelectedCategory(category.id); setEmparoSelectedVariation(null); setEmparoQuantity(1); }}
                            >
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase tracking-wide">{category.name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/30 text-[10px]">{items.length} items</span>
                                  <ChevronRight className="h-4 w-4 text-white/40" />
                                </div>
                              </div>
                            </div>
                            <div className="bg-[#111d2e] rounded-b-xl border border-white/10 border-t-0 p-3 space-y-2">
                              {items.slice(0, 4).map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="bg-[#0a1628] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all"
                                  data-testid={`menu-item-emparo-${item.id}`}
                                >
                                  <div className="flex">
                                    {(item.image || item.videoUrl || item.gifUrl) && (
                                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden">
                                        {item.videoUrl ? (
                                          <video src={item.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline poster={item.image} />
                                        ) : item.gifUrl ? (
                                          <img src={item.gifUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        )}
                                      </div>
                                    )}
                                    <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                                      <h4 className="font-semibold text-white text-xs leading-tight line-clamp-2">{item.name}</h4>
                                      {(!item.variants || item.variants.length === 0) && (
                                        <div className="flex items-center justify-between mt-1.5">
                                          <span className="font-bold text-white text-xs">{currencySymbol}{Number(item.price).toFixed(2)}</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-[#C41E3A] transition-all"
                                            data-testid={`add-item-emparo-${item.id}`}
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      )}
                                      {item.variants && item.variants.length > 0 && (
                                        <span className="text-white/30 text-[10px] mt-1">{item.variants.length} sizes</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {items.length > 4 && (
                                <button
                                  onClick={() => { setEmparoSelectedCategory(category.id); setEmparoSelectedVariation(null); setEmparoQuantity(1); }}
                                  className="w-full py-2 text-xs font-semibold text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
                                >
                                  View all {items.length} items →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Footer */}
            </>
            )}

            <footer id="emparo-contact" className="border-t border-white/10 py-10 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-[#C41E3A] font-bold text-sm mb-3">About Us</h4>
                    <p className="text-white/40 text-xs leading-relaxed">
                      {restaurant?.description || 'Authentic flame-grilled cuisine with the finest ingredients.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[#C41E3A] font-bold text-sm mb-3">Contact Us</h4>
                    <div className="space-y-2 text-white/50 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#C41E3A] shrink-0 mt-0.5" />
                        <span>{restaurant.address || ''}</span>
                      </div>
                      {restaurant?.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-[#C41E3A] text-xs">📞</span>
                          <a href={`tel:${restaurant.phone}`} className="hover:text-white transition-colors">{restaurant.phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#C41E3A] font-bold text-sm mb-3">Opening Hours</h4>
                    <div className="space-y-2 text-white/50 text-xs">
                      <div>
                        <p className="font-medium text-white/70 mb-1">Delivery</p>
                        <p>Mon-Thu: {restaurant.deliveryHoursMonThu || "1:00 PM - 4:00 AM"}</p>
                        <p>Fri-Sat: {restaurant.deliveryHoursFriSat || "1:00 PM - 4:00 AM"}</p>
                        <p>Sun: {restaurant.deliveryHoursSun || "1:00 PM - 4:00 AM"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-white/70 mb-1">Collection</p>
                        <p>Mon-Thu: {restaurant.collectionHoursMonThu || "1:00 PM - 4:00 AM"}</p>
                        <p>Fri-Sat: {restaurant.collectionHoursFriSat || "1:00 PM - 4:00 AM"}</p>
                        <p>Sun: {restaurant.collectionHoursSun || "1:00 PM - 4:00 AM"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/10 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-white/30 text-xs">© 2025 {restaurant?.name || 'Emparo Peri Peri'}. All rights reserved.</p>
                    <a href="/terms" className="text-white/30 text-[10px] hover:text-[#C41E3A] transition-colors" data-testid="link-terms-emparo">Terms & Conditions</a>
                  </div>
                  <button onClick={() => { playClick(); scrollToTop(); }} className="flex items-center gap-1.5 text-[#C41E3A] hover:text-[#e63950] transition-colors text-xs font-medium" data-testid="button-back-to-top-footer">
                    <ArrowUp className="h-3.5 w-3.5" /> Back to Top
                  </button>
                </div>
              </div>
            </footer>
          </div>

          {/* Emparo Floating Cart Button */}
          {!emparoCartOpen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <Button 
              onClick={() => setEmparoCartOpen(true)}
              className="w-full h-12 rounded-full shadow-2xl text-white flex justify-between items-center px-5 transition-all hover:scale-[1.02]"
              style={{ background: '#C41E3A' }}
              data-testid="button-view-basket-emparo"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm">
                  {cartCount}
                </div>
                <span className="font-bold text-sm">View Basket</span>
              </div>
              <span className="font-bold text-base">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </Button>
          </div>
          )}
          <Sheet open={emparoCartOpen} onOpenChange={setEmparoCartOpen}>
            <SheetContent 
              className="w-full sm:max-w-md flex flex-col border-l-0"
              side="right"
              style={{ background: '#0a1628' }}
            >
              <SheetHeader className="pb-4">
                <SheetTitle className="text-2xl font-bold text-white">
                  Your Basket
                </SheetTitle>
              </SheetHeader>

              {/* Collection Discount Notice */}
              {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && (
                <div className="py-3 px-4 bg-green-500/20 border border-green-400/30 rounded-lg mt-2">
                  <p className="text-green-400 text-sm font-medium text-center">
                    ✨ {restaurant.collectionDiscountPercent}% discount over {currencySymbol}{Number(restaurant.collectionDiscountMinimum || 15).toFixed(2)} on collection
                  </p>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-auto py-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                    <ShoppingBasket className="h-16 w-16" />
                    <p>Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => {
                      const itemTotalPrice = getItemTotalPrice(item);
                      const extrasTotal = item.extras.reduce((sum, extraName) => {
                        const topping = activeToppings.find(t => t.name === extraName);
                        return sum + (topping ? Number(topping.price) : 0);
                      }, 0);
                      return (
                        <div 
                          key={item.id} 
                          className="p-4 rounded-xl border border-white/20"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                            backdropFilter: 'blur(10px)',
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Quantity Controls */}
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/30 text-green-400 hover:bg-green-500/50 transition-all"
                                  data-testid={`increase-qty-emparo-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <span className="text-white font-bold text-sm w-7 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      setCart(prev => prev.filter(i => i.id !== item.id));
                                    } else {
                                      setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-all"
                                  data-testid={`decrease-qty-emparo-${item.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
                                )}
                                {item.extras.length > 0 && (
                                  <p className="text-xs text-green-400 mt-0.5 font-medium">
                                    EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                                  </p>
                                )}
                                {item.optionGroups && item.optionGroups.length > 0 && (
                                  <div className="mt-0.5 space-y-0.5">
                                    {item.optionGroups.map((group, gIdx) => (
                                      <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                        {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {item.removedIngredients.length > 0 && (
                                  <p className="text-xs text-red-400 mt-0.5 font-medium">
                                    NO: {item.removedIngredients.join(', ')}
                                  </p>
                                )}
                                <p className="text-sm text-white/60 mt-1">{currencySymbol}{item.price.toFixed(2)}{extrasTotal > 0 ? ` + ${currencySymbol}${extrasTotal.toFixed(2)} extras` : ''} each</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="font-bold text-yellow-300 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer - Total and Checkout */}
              <div className="pt-4 space-y-4">
                {/* Special Instructions */}
                <div className="px-1">
                  <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., Wheelchair access, dietary requirements, allergies, extra spicy..."
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    rows={2}
                    data-testid="input-special-instructions-emparo"
                  />
                </div>
                
                <div className="space-y-2">
                  {restaurant?.cutleryOptionEnabled && (
                    <div
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                      style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                      onClick={() => setAddCutlery(!addCutlery)}
                      data-testid="button-add-cutlery"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                          {addCutlery && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                      </div>
                      <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                    </div>
                  )}
                  {addCutlery && restaurant?.cutleryOptionEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                      <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                    </div>
                  )}
                  {orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && cartTotal >= Number(restaurant.collectionDiscountMinimum || 15) && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Collection Discount ({restaurant.collectionDiscountPercent}%)</span>
                      <span>-{currencySymbol}{(cartTotal * (restaurant.collectionDiscountPercent / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-400">
                      {currencySymbol}{(orderType === "takeaway" && restaurant.collectionDiscountPercent && restaurant.collectionDiscountPercent > 0 && cartTotal >= Number(restaurant.collectionDiscountMinimum || 15)
                        ? cartTotal * (1 - restaurant.collectionDiscountPercent / 100)
                        : cartTotal
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:opacity-90 text-white"
                      style={{ background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' }}
                      disabled={cart.length === 0 || !isAcceptingOrders}
                      data-testid="button-checkout-emparo"
                    >
                      {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                    style={{ background: '#0f1419', border: '1px solid #1e2a36' }}
                  >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                      {/* Header */}
                      <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                        <CheckSquare className="h-6 w-6 text-white" />
                        <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                      </DialogHeader>
                      
                      {/* Order Type Selector */}
                      <div className="mb-4 space-y-2">
                        <Label className="text-white/80 text-sm">Order Type</Label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setOrderType("delivery")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "delivery" 
                                ? 'border-orange-500 bg-orange-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-delivery-emparo"
                          >
                            <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-orange-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType("takeaway")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                              orderType === "takeaway" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-order-collection-emparo"
                          >
                            <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                          </button>
                        </div>
                      </div>

                      {/* Estimated Delivery Time */}
                      {orderType === "delivery" && (
                        <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                              <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Your Name</Label>
                          <Input 
                            placeholder="Enter your full name" 
                            required 
                            className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                            data-testid="input-checkout-name-emparo"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-white/80 text-sm">Phone Number</Label>
                          <div className="flex gap-2">
                            <div className="w-16 h-10 bg-transparent border border-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                            <Input 
                              type="tel" 
                              placeholder="7XXX XXX XXX" 
                              required 
                              className="flex-1 h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                              data-testid="input-checkout-phone-emparo"
                            />
                          </div>
                        </div>
                        {orderType === "delivery" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Delivery Address</Label>
                              <Input 
                                placeholder="House number and street" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.deliveryAddress = e.target.value}
                                data-testid="input-checkout-address-emparo"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-white/80 text-sm">Postcode</Label>
                              <Input 
                                placeholder="E.G. WD18 0AB" 
                                required 
                                className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                                onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                                data-testid="input-checkout-postcode-emparo"
                              />
                            </div>
                          </>
                        )}

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Payment Method</Label>
                          <div className="flex gap-3">
                            {orderType !== "delivery" && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("cash")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "cash" 
                                  ? 'border-green-500 bg-green-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-cash-emparo"
                            >
                              <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                            </button>
                            )}
                            {hasStripeKeys && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("card")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "card" 
                                  ? 'border-blue-500 bg-blue-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-card-emparo"
                            >
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                            </button>
                            )}
                            {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod("bank_transfer")}
                              className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                paymentMethod === "bank_transfer" 
                                  ? 'border-purple-500 bg-purple-500/20' 
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                              data-testid="button-payment-bank-emparo"
                            >
                              <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                            </button>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                          <div className="space-y-2">
                            {cart.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            {cart.length > 3 && (
                              <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                            )}
                          </div>
                          <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details Section */}
                        {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <Elements stripe={stripePromise}>
                              <WalletPaymentButton
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                currency={restaurant?.currency || 'GBP'}
                                label={restaurant?.name || 'Order Total'}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              />
                              <div className="relative my-3">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-[#0f1419] px-2 text-gray-500">or pay with card</span></div>
                              </div>
                              <CardPaymentForm
                                amount={calculateFinalTotal(cartTotal, orderType)}
                                restaurantId={restaurant.id}
                                onPaymentSuccess={handleCardPaymentSuccess}
                                onPaymentError={handleCardPaymentError}
                                isProcessing={isProcessingPayment}
                                setIsProcessing={setIsProcessingPayment}
                                themeStyle="emparo"
                                validateForm={validateCheckoutForm}
                                validateDeliveryAsync={validateDeliveryForCard}
                              >
                                <div></div>
                              </CardPaymentForm>
                            </Elements>
                          </div>
                        )}
                        {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                          <div className="border-t border-gray-700 pt-4">
                            <FallbackCardForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="emparo"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                          </div>
                        )}
                        {paymentMethod === "card" && !stripeLoadFinished && (
                          <p className="text-sm text-gray-400">Loading card payment...</p>
                        )}
                        {cardError && (
                          <p className="text-sm text-red-400">{cardError}</p>
                        )}

                        {paymentMethod === "bank_transfer" && (
                          <BankTransferQRSection
                            restaurant={restaurant}
                            total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                            currencySymbol={currencySymbol}
                          />
                        )}
                      </div>
                    </div>

                    {/* Fixed Bottom Button */}
                    <div className="p-4 border-t border-gray-800 bg-[#0f1419]">
                      {paymentMethod === "card" ? (
                        <Button 
                          type="submit"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-pay-now-emparo"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : paymentMethod === "bank_transfer" ? (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-bank-emparo"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <Building className="mr-2 h-5 w-5" />
                          I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                          }}
                          className="w-full h-12 text-base font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all"
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-emparo"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CheckSquare className="mr-2 h-5 w-5" />
                          Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </SheetContent>
          </Sheet>

          {/* Emparo Extras Dialog */}
          <Dialog open={showEmparoExtras} onOpenChange={(open) => { setShowEmparoExtras(open); if (!open) setTempSelectedExtras([]); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(180deg, #1a1a4e 0%, #2d1b4e 50%, #4a1a6e 100%)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#F97316' }} className="text-xl">Add Extras to Your Order?</DialogTitle>
                </DialogHeader>
                <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select any extras you'd like to add</p>
              </div>
              
              <ScrollArea className="max-h-[50vh] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {activeToppings.map((topping: ExtraTopping) => (
                    <button
                      key={topping.id}
                      onClick={() => {
                        setTempSelectedExtras(prev => 
                          prev.includes(topping.name) 
                            ? prev.filter(n => n !== topping.name)
                            : [...prev, topping.name]
                        );
                      }}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        tempSelectedExtras.includes(topping.name)
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{topping.name}</p>
                      <p className="text-xs mt-1" style={{ color: '#F97316' }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {tempSelectedExtras.length > 0 && (
                <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(249, 115, 22, 0.3)', background: 'rgba(249, 115, 22, 0.1)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{tempSelectedExtras.length} extra(s) selected</span>
                    <span className="font-bold" style={{ color: '#F97316' }}>
                      +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                        const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                        return sum + (t ? Number(t.price) : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempSelectedExtras([]);
                    setShowEmparoExtras(false);
                    setEmparoCartOpen(true);
                  }}
                  className="flex-1"
                  style={{ borderColor: 'rgba(249, 115, 22, 0.5)', color: '#F97316', background: 'transparent' }}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => {
                    setShowEmparoExtras(false);
                    setEmparoCartOpen(true);
                  }}
                  className="flex-1 font-bold"
                  style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea580c 100%)', color: '#ffffff' }}
                >
                  {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Emparo Edit Cart Item Dialog */}
          <Dialog open={!!editingCartItem} onOpenChange={(open) => !open && setEditingCartItem(null)}>
            <DialogContent 
              className="border-0 p-0 overflow-hidden max-w-sm"
              style={{
                background: 'linear-gradient(180deg, #1a1a4e 0%, #2d1b4e 50%, #4a1a6e 100%)',
              }}
            >
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-yellow-400">
                    Edit Item
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    {editingCartItem?.name}
                  </DialogDescription>
                </DialogHeader>
                
                {editingCartItem?.description && (
                  <div className="mt-4 space-y-3">
                    <p className="text-white/80 text-sm font-medium">Remove ingredients:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {editingCartItem.description.split(',').map((ingredient, idx) => {
                        const trimmedIngredient = ingredient.trim();
                        if (!trimmedIngredient) return null;
                        const isRemoved = tempRemovedIngredients.includes(trimmedIngredient);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (isRemoved) {
                                setTempRemovedIngredients(prev => prev.filter(i => i !== trimmedIngredient));
                              } else {
                                setTempRemovedIngredients(prev => [...prev, trimmedIngredient]);
                              }
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                              isRemoved 
                                ? 'bg-red-500/30 border border-red-500/50' 
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
                            }`}
                          >
                            <span className={`text-sm ${isRemoved ? 'text-red-300 line-through' : 'text-white'}`}>
                              {trimmedIngredient}
                            </span>
                            {isRemoved ? (
                              <X className="h-4 w-4 text-red-400" />
                            ) : (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditingCartItem(null)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingCartItem) {
                        setCart(prev => prev.map(item => 
                          item.id === editingCartItem.id 
                            ? { ...item, removedIngredients: tempRemovedIngredients }
                            : item
                        ));
                        setEditingCartItem(null);
                        toast({
                          title: "Item Updated",
                          description: tempRemovedIngredients.length > 0 
                            ? `Removed: ${tempRemovedIngredients.join(', ')}`
                            : "No changes made",
                          duration: 2000,
                        });
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Emparo Add Extras Dialog */}
          <Dialog open={!!addingExtrasToItem} onOpenChange={(open) => !open && setAddingExtrasToItem(null)}>
            <DialogContent 
              className="border-0 p-0 overflow-hidden max-w-sm"
              style={{
                background: 'linear-gradient(180deg, #1a1a4e 0%, #2d1b4e 50%, #4a1a6e 100%)',
              }}
            >
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-green-400">
                    Add Extras
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    {addingExtrasToItem?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 space-y-3">
                  <p className="text-white/80 text-sm font-medium">Select extra toppings:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeToppings.length > 0 ? activeToppings.map((topping) => {
                      const isSelected = tempSelectedExtras.includes(topping.name);
                      const isSoldOut = topping.isActive === false;
                      return (
                        <button
                          key={topping.id}
                          disabled={isSoldOut}
                          onClick={() => {
                            if (isSoldOut) return;
                            if (isSelected) {
                              setTempSelectedExtras(prev => prev.filter(t => t !== topping.name));
                            } else {
                              setTempSelectedExtras(prev => [...prev, topping.name]);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                            isSoldOut
                              ? 'bg-red-500/10 border border-red-500/30 cursor-not-allowed opacity-60'
                              : isSelected 
                                ? 'bg-green-500/30 border border-green-500/50' 
                                : 'bg-white/10 border border-white/20 hover:bg-white/20'
                          }`}
                          data-testid={`extra-topping-emparo-${topping.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className={`text-sm flex items-center gap-2 ${isSoldOut ? 'line-through text-white/50' : isSelected ? 'text-green-300 font-medium' : 'text-white'}`}>
                            {topping.name}
                            {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full no-underline">SOLD OUT</span>}
                          </span>
                          {isSoldOut ? (
                            <span className="text-red-400 text-xs">Unavailable</span>
                          ) : (
                            <span className={`text-sm ${isSelected ? 'text-green-300' : 'text-white/60'}`}>
                              {currencySymbol}{Number(topping.price).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    }) : (
                      <p className="text-white/50 text-sm text-center py-4">No extra toppings available</p>
                    )}
                  </div>
                  {tempSelectedExtras.length > 0 && (
                    <div className="pt-2 border-t border-white/20">
                      <p className="text-sm text-green-400 font-medium">
                        Total extras: +{currencySymbol}{tempSelectedExtras.reduce((total, name) => {
                          const topping = activeToppings.find(t => t.name === name);
                          return total + (topping ? Number(topping.price) : 0);
                        }, 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAddingExtrasToItem(null)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (addingExtrasToItem) {
                        setCart(prev => prev.map(item => 
                          item.id === addingExtrasToItem.id 
                            ? { ...item, extras: tempSelectedExtras }
                            : item
                        ));
                        setAddingExtrasToItem(null);
                        const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                          const topping = activeToppings.find(t => t.name === name);
                          return sum + (topping ? Number(topping.price) : 0);
                        }, 0);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
                  >
                    Save Extras
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : isBurgerTheme ? (
      <>
        {/* BURGER THEME LAYOUT - Dark dramatic style */}
        <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
          {/* Sticky Navigation */}
          <nav className="sticky top-0 z-50 py-4 px-4" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', borderBottom: '1px solid #333' }}>
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <button 
                onClick={() => navigate(welcomeUrl)}
                className="flex items-center gap-2 text-white/80 hover:text-yellow-400 transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-wide">Back</span>
              </button>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => openBooking()}
                  className="px-4 py-2 border-2 border-yellow-500 text-yellow-500 text-sm font-bold uppercase tracking-wider hover:bg-yellow-500 hover:text-black transition-all"
                  data-testid="button-booking"
                >
                  Book Table
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 text-white/80 text-sm font-bold uppercase tracking-wider hover:text-yellow-400 transition-colors flex items-center gap-2"
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                  {currentCustomer ? 'Account' : 'Log In'}
                </button>
              </div>
            </div>
          </nav>

          {/* Restaurant Header */}
          <div className="py-8 px-4 text-center" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)' }}>
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-16 mx-auto mb-4 object-contain" />
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-wide">
              {restaurant.name}
            </h1>
            <p className="text-yellow-500 text-lg font-medium">{restaurant.address}</p>
          </div>

          {/* Main Menu Content */}
          <main className="max-w-5xl mx-auto px-4 py-8">
            {/* Allergen Button */}
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setShowAllergenMatrix(true)}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-500/50 text-yellow-500 text-sm font-medium hover:bg-yellow-500/10 transition-all"
                data-testid="button-allergy-info-burger"
              >
                <AlertTriangle className="h-4 w-4" />
                View Allergens
              </button>
            </div>

            {/* Menu Items - Full width dramatic layout */}
            <div className="space-y-0">
              {availableCategories.map(category => {
                const items = getItemsByCategory(category.id);
                if (items.length === 0) return null;

                return (
                  <div key={category.id} id={`category-${category.id}`} className="mb-12">
                    {/* Category Title */}
                    <div className="mb-6 border-b border-yellow-500/30 pb-3">
                      <h2 className="text-2xl font-black text-white uppercase tracking-wider">{category.name}</h2>
                    </div>
                    
                    {/* Items List - Dramatic full-width layout */}
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative overflow-hidden group"
                          style={{ 
                            background: index % 2 === 0 
                              ? 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)'
                              : 'linear-gradient(90deg, #0f0f0f 0%, #1f1f1f 50%, #0f0f0f 100%)'
                          }}
                          data-testid={`menu-item-${item.id}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:min-h-[200px]">
                            {/* Left Side - Text Content */}
                            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-wide">
                                {item.name}
                              </h3>
                              {item.description && (
                                <p className="text-gray-400 text-sm mb-4 max-w-md">{item.description}</p>
                              )}
                              {/* Variant Options or Single Price */}
                              {item.variants && item.variants.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                  {item.variants.map((variant) => (
                                    <div key={variant.id} className="flex items-center gap-4">
                                      <span className={`text-sm ${(variant as any).available === false ? 'text-gray-600 line-through' : 'text-gray-400'}`}>{variant.name}</span>
                                      <span className={`text-xl font-black ${(variant as any).available === false ? 'text-yellow-500/40' : 'text-yellow-500'}`}>{currencySymbol}{variant.price}</span>
                                      {item.available !== false && (variant as any).available !== false ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addVariantToCart(item, variant);
                                          }}
                                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider text-xs transition-all hover:scale-105 active:scale-95 border-2 border-yellow-500"
                                          data-testid={`add-variant-burger-${variant.id}`}
                                        >
                                          Add
                                        </button>
                                      ) : (variant as any).available === false ? (
                                        <span className="text-red-500 font-black uppercase tracking-wider text-xs">SOLD OUT</span>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <p className="text-yellow-500 text-2xl md:text-3xl font-black mb-4">
                                    {currencySymbol}{item.price}
                                  </p>
                                  {item.available === false ? (
                                    <span className="text-red-500 font-black uppercase tracking-wider text-lg">SOLD OUT</span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item);
                                      }}
                                      className="w-fit px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider text-sm transition-all hover:scale-105 active:scale-95 border-2 border-yellow-500"
                                      data-testid={`add-item-${item.id}`}
                                    >
                                      Add to Cart
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* Right Side - Large Image/Video/GIF */}
                            <div className="relative w-full md:w-[45%] h-[200px] md:h-[250px] overflow-hidden">
                              {item.videoUrl ? (
                                <video 
                                  src={item.videoUrl}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : item.gifUrl ? (
                                <img 
                                  src={item.gifUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <img 
                                  src={item.image || getItemImage(category.id, index)}
                                  alt={item.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              )}
                              {/* Gradient overlay for text readability */}
                              <div 
                                className="absolute inset-0 md:hidden"
                                style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(26,26,26,0.8) 100%)' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Footer */}
          <footer className="py-8 px-4 text-center border-t border-gray-800">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</p>
            <a href="/terms" className="text-gray-500 text-xs hover:text-white mt-2 inline-block" data-testid="link-terms">Terms & Conditions</a>
          </footer>
        </div>

        {/* Floating Cart Button - Burger Theme */}
        {!isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <Button 
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider shadow-2xl flex justify-between items-center px-6 transition-all hover:scale-[1.02]"
            data-testid="button-view-basket"
          >
            <div className="flex items-center gap-3">
              <div className="bg-black/20 h-9 w-9 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </div>
              <span className="text-lg">View Basket</span>
            </div>
            <span className="text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
          </Button>
        </div>
        )}
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetContent 
            className="w-full sm:max-w-md flex flex-col border-l-0"
            style={{ background: '#1a1a1a' }}
          >
            <SheetHeader>
              <SheetTitle className="text-2xl font-black text-yellow-500 uppercase tracking-wider">
                Your Basket
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto py-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <ShoppingBasket className="h-16 w-16" />
                  <p>Your basket is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => {
                    const itemTotalPrice = getItemTotalPrice(item);
                    const extrasTotal = item.extras.reduce((sum, extraName) => {
                      const topping = activeToppings.find(t => t.name === extraName);
                      return sum + (topping ? Number(topping.price) : 0);
                    }, 0);
                    return (
                      <div 
                        key={item.id} 
                        className="p-4 border border-gray-700 bg-gray-900/50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Quantity Controls */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                                className="w-7 h-7 flex items-center justify-center bg-yellow-500/30 text-yellow-500 hover:bg-yellow-500/50 transition-all"
                                data-testid={`increase-qty-burger-${item.id}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <span className="text-white font-black text-sm w-7 text-center">{item.quantity}</span>
                              <button
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    setCart(prev => prev.filter(i => i.id !== item.id));
                                  } else {
                                    setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-red-500/30 text-red-500 hover:bg-red-500/50 transition-all"
                                data-testid={`decrease-qty-burger-${item.id}`}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white uppercase">{item.name}</p>
                              {item.extras.length > 0 && (
                                <p className="text-xs text-yellow-500 mt-0.5 font-medium">
                                  EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                                </p>
                              )}
                              {item.optionGroups && item.optionGroups.length > 0 && (
                                <div className="mt-0.5 space-y-0.5">
                                  {item.optionGroups.map((group, gIdx) => (
                                    <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                      {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                    </p>
                                  ))}
                                </div>
                              )}
                              {item.removedIngredients.length > 0 && (
                                <p className="text-xs text-red-400 mt-0.5 font-medium">
                                  NO: {item.removedIngredients.join(', ')}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 mt-1">{currencySymbol}{item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="font-black text-yellow-500 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Special Instructions */}
            <div className="mt-4 px-1">
              <label className="text-gray-400 text-sm mb-2 block">Special Instructions (optional)</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies, extra spicy..."
                className="w-full p-3 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                rows={2}
                data-testid="input-special-instructions-burger"
              />
            </div>
            
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div className="flex justify-between text-xl font-black">
                <span className="text-white uppercase">Total</span>
                <span className="text-yellow-500">{currencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
              <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className={`w-full h-14 text-lg font-black uppercase tracking-wider ${!isAcceptingOrders ? 'bg-gray-600 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-black'}`} 
                    disabled={cart.length === 0 || !isAcceptingOrders}
                  >
                    {!isAcceptingOrders ? 'Orders Currently Closed' : 'Checkout'}
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="border-0 p-0 max-h-[90vh] overflow-hidden flex flex-col"
                  style={{ background: '#0f1419', border: '1px solid #1e2a36' }}
                >
                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-5 pb-4 max-h-[calc(90vh-80px)]">
                    {/* Header */}
                    <DialogHeader className="flex flex-row items-center gap-2 mb-4">
                      <CheckSquare className="h-6 w-6 text-white" />
                      <DialogTitle className="text-xl font-bold text-white">Complete Your Order</DialogTitle>
                    </DialogHeader>
                    
                    {/* Order Type Selector */}
                    <div className="mb-4 space-y-2">
                      <Label className="text-white/80 text-sm">Order Type</Label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOrderType("delivery")}
                          className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                            orderType === "delivery" 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          data-testid="button-order-delivery-burger"
                        >
                          <Truck className={`h-5 w-5 ${orderType === "delivery" ? 'text-orange-400' : 'text-gray-400'}`} />
                          <span className={`font-medium ${orderType === "delivery" ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType("takeaway")}
                          className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                            orderType === "takeaway" 
                              ? 'border-green-500 bg-green-500/20' 
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                          data-testid="button-order-collection-burger"
                        >
                          <ShoppingBag className={`h-5 w-5 ${orderType === "takeaway" ? 'text-green-400' : 'text-gray-400'}`} />
                          <span className={`font-medium ${orderType === "takeaway" ? 'text-white' : 'text-gray-400'}`}>Collection</span>
                        </button>
                      </div>
                    </div>

                    {/* Estimated Delivery Time */}
                    {orderType === "delivery" && (
                      <div className="mb-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-green-400 font-medium text-sm">Estimated Delivery Time</p>
                            <p className="text-white/70 text-sm">{restaurant.deliveryTimeMinutes || 45} minutes</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-white/80 text-sm">Your Name</Label>
                        <Input 
                          placeholder="Enter your full name" 
                          required 
                          className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                          onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                          data-testid="input-checkout-name-burger"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/80 text-sm">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="w-16 h-10 bg-transparent border border-gray-700 rounded-md flex items-center justify-center text-gray-400 text-sm">+44</div>
                          <Input 
                            type="tel" 
                            placeholder="7XXX XXX XXX" 
                            required 
                            className="flex-1 h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                            onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                            data-testid="input-checkout-phone-burger"
                          />
                        </div>
                      </div>
                      {orderType === "delivery" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-white/80 text-sm">Delivery Address</Label>
                            <Input 
                              placeholder="House number and street" 
                              required 
                              className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.deliveryAddress = e.target.value}
                              data-testid="input-checkout-address-burger"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-white/80 text-sm">Postcode</Label>
                            <Input 
                              placeholder="E.G. WD18 0AB" 
                              required 
                              className="h-10 bg-transparent border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-500" 
                              onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value}
                              data-testid="input-checkout-postcode-burger"
                            />
                          </div>
                        </>
                      )}

                      {/* Payment Method */}
                      <div className="space-y-2">
                        <Label className="text-white/80 text-sm">Payment Method</Label>
                        <div className="flex gap-3">
                          {orderType !== "delivery" && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                              paymentMethod === "cash" 
                                ? 'border-green-500 bg-green-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-payment-cash-burger"
                          >
                            <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-green-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                          </button>
                          )}
                          {hasStripeKeys && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                              paymentMethod === "card" 
                                ? 'border-blue-500 bg-blue-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-payment-card-burger"
                          >
                            <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                          </button>
                          )}
                          {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("bank_transfer")}
                            className={`flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                              paymentMethod === "bank_transfer" 
                                ? 'border-purple-500 bg-purple-500/20' 
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                            }`}
                            data-testid="button-payment-bank-burger"
                          >
                            <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                          </button>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="border-t border-gray-700 pt-4 mt-4">
                        <h3 className="text-white font-semibold mb-3">Order Summary</h3>
                        <div className="space-y-2">
                          {cart.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-300">{item.quantity}x {item.name}</span>
                              <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {cart.length > 3 && (
                            <p className="text-gray-500 text-sm">+{cart.length - 3} more items</p>
                          )}
                        </div>
                        <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                          {restaurant?.cutleryOptionEnabled && (
                            <div
                              className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                              style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                              onClick={() => setAddCutlery(!addCutlery)}
                              data-testid="button-add-cutlery"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                  {addCutlery && <span className="text-white text-xs">✓</span>}
                                </div>
                                <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                              </div>
                              <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-white">{currencySymbol}{cartTotal.toFixed(2)}</span>
                          </div>
                          {addCutlery && restaurant?.cutleryOptionEnabled && (
                            <div className="flex justify-between text-sm">
                              <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                              <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                            </div>
                          )}
                          {orderType === "delivery" && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Delivery</span>
                              <span className="text-white">{currencySymbol}{Number(restaurant.deliveryFee || 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold pt-1">
                            <span className="text-white">Total</span>
                            <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Details Section */}
                      {paymentMethod === "card" && stripePromise && stripeActuallyLoaded && (
                        <div className="border-t border-gray-700 pt-4">
                          <Elements stripe={stripePromise}>
                            <WalletPaymentButton
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              currency={restaurant?.currency || 'GBP'}
                              label={restaurant?.name || 'Order Total'}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            />
                            <div className="relative my-3">
                              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                              <div className="relative flex justify-center text-xs"><span className="bg-[#0f1419] px-2 text-gray-500">or pay with card</span></div>
                            </div>
                            <CardPaymentForm
                              amount={calculateFinalTotal(cartTotal, orderType)}
                              restaurantId={restaurant.id}
                              onPaymentSuccess={handleCardPaymentSuccess}
                              onPaymentError={handleCardPaymentError}
                              isProcessing={isProcessingPayment}
                              setIsProcessing={setIsProcessingPayment}
                              themeStyle="dark"
                              validateForm={validateCheckoutForm}
                              validateDeliveryAsync={validateDeliveryForCard}
                            >
                              <div></div>
                            </CardPaymentForm>
                          </Elements>
                        </div>
                      )}
                      {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                        <div className="border-t border-gray-700 pt-4">
                          <FallbackCardForm
                            amount={calculateFinalTotal(cartTotal, orderType)}
                            restaurantId={restaurant.id}
                            onPaymentSuccess={handleCardPaymentSuccess}
                            onPaymentError={handleCardPaymentError}
                            isProcessing={isProcessingPayment}
                            setIsProcessing={setIsProcessingPayment}
                            themeStyle="dark"
                            validateForm={validateCheckoutForm}
                            validateDeliveryAsync={validateDeliveryForCard}
                          />
                        </div>
                      )}
                      {paymentMethod === "card" && !stripeLoadFinished && (
                        <p className="text-sm text-gray-400">Loading card payment...</p>
                      )}
                      {cardError && (
                        <p className="text-sm text-red-400">{cardError}</p>
                      )}

                      {paymentMethod === "bank_transfer" && (
                        <BankTransferQRSection
                          restaurant={restaurant}
                          total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                          currencySymbol={currencySymbol}
                        />
                      )}
                    </div>
                  </div>

                  {/* Fixed Bottom Button */}
                  <div className="p-4 border-t border-gray-800 bg-[#0f1419]">
                    {paymentMethod === "card" ? (
                      <Button 
                        type="submit"
                        onClick={() => {
                          const form = document.getElementById('card-payment-form') as HTMLFormElement;
                          if (form) form.requestSubmit();
                        }}
                        className="w-full h-12 text-base font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                        disabled={isProcessingPayment || createOrderMutation.isPending}
                        data-testid="button-pay-now-burger"
                      >
                        {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                      </Button>
                    ) : paymentMethod === "bank_transfer" ? (
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                        }}
                        className="w-full h-12 text-base font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all"
                        disabled={createOrderMutation.isPending}
                        data-testid="button-place-order-bank-burger"
                      >
                        {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <Building className="mr-2 h-5 w-5" />
                        I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                      </Button>
                    ) : (
                      <Button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any);
                        }}
                        className="w-full h-12 text-base font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-all"
                        disabled={createOrderMutation.isPending}
                        data-testid="button-place-order-burger"
                      >
                        {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        <CheckSquare className="mr-2 h-5 w-5" />
                        Place Order (Pay Cash) - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </SheetContent>
        </Sheet>

        {/* Burger Extras Dialog */}
        <Dialog open={showBurgerExtras} onOpenChange={(open) => { setShowBurgerExtras(open); if (!open) setTempSelectedExtras([]); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: '#1a1a1a', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <div className="p-4 border-b" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
              <DialogHeader>
                <DialogTitle style={{ color: '#eab308' }} className="text-xl font-black uppercase tracking-wider">Add Extras to Your Order?</DialogTitle>
              </DialogHeader>
              <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Select any extras you'd like to add</p>
            </div>
            
            <ScrollArea className="max-h-[50vh] p-4">
              <div className="grid grid-cols-2 gap-3">
                {activeToppings.map((topping: ExtraTopping) => (
                  <button
                    key={topping.id}
                    onClick={() => {
                      setTempSelectedExtras(prev => 
                        prev.includes(topping.name) 
                          ? prev.filter(n => n !== topping.name)
                          : [...prev, topping.name]
                      );
                    }}
                    className={`p-3 border-2 transition-all text-left ${
                      tempSelectedExtras.includes(topping.name)
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                    }`}
                  >
                    <p className="font-bold text-sm uppercase" style={{ color: '#ffffff' }}>{topping.name}</p>
                    <p className="text-xs mt-1" style={{ color: '#eab308' }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {tempSelectedExtras.length > 0 && (
              <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(234, 179, 8, 0.3)', background: 'rgba(234, 179, 8, 0.1)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{tempSelectedExtras.length} extra(s) selected</span>
                  <span className="font-black" style={{ color: '#eab308' }}>
                    +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                      const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                      return sum + (t ? Number(t.price) : 0);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setTempSelectedExtras([]);
                  setShowBurgerExtras(false);
                  setIsCartOpen(true);
                }}
                className="flex-1 font-black uppercase"
                style={{ borderColor: 'rgba(234, 179, 8, 0.5)', color: '#eab308', background: 'transparent' }}
              >
                Skip
              </Button>
              <Button
                onClick={() => {
                  setShowBurgerExtras(false);
                  setIsCartOpen(true);
                }}
                className="flex-1 font-black uppercase"
                style={{ background: '#eab308', color: '#000000' }}
              >
                {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </>
      ) : (
      <>
      {/* Spicy Theme Header - Matches design from image */}
      {isSpicyTheme && (
        <div className="z-50">
          {/* Top Navigation Bar - Dark Navy */}
          <div className="py-3 px-4" style={{ background: '#0f172a' }}>
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <button 
                onClick={() => navigate(welcomeUrl)}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">BACK</span>
              </button>
              <div className="flex items-center gap-3">
                {showInstallButton && !isPWAInstalled && (
                  <button 
                    onClick={handleInstallClick}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold hover:from-red-600 hover:to-orange-600 transition-all flex items-center gap-2 shadow-lg animate-pulse"
                    data-testid="button-install-app-spicy"
                  >
                    <Plus className="h-4 w-4" />
                    Install App
                  </button>
                )}
                <button 
                  onClick={() => openBooking()}
                  className="px-4 py-2 rounded-lg border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/10 transition-all"
                  data-testid="button-booking"
                >
                  Booking
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 text-white/80 text-sm font-medium hover:text-white transition-colors flex items-center gap-2"
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                  Log in &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Main Hero Section - Red Gradient */}
          <div 
            className="py-8 px-4"
            style={{ background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 30%, #1e3a5f 70%, #0f172a 100%)' }}
          >
            <div className="max-w-5xl mx-auto text-center">
              {/* Authentic Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 mb-4">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-medium text-white/90">Authentic Peri Peri</span>
                <span className="text-lg">🔥</span>
              </div>
              
              {/* Restaurant Name */}
              <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#22d3ee' }}>
                {restaurant.name}
              </h1>
              
              {/* Tagline */}
              <p className="text-white/80 text-lg mb-6">
                Spicy • Fresh • Delicious
              </p>
              
              {/* Info Cards Row */}
              <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch max-w-3xl mx-auto">
                {/* Collect Card */}
                <div 
                  className="flex items-center gap-3 rounded-2xl px-6 py-4 flex-1 border-2 border-red-400/50"
                  style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(185, 28, 28, 0.9) 100%)' }}
                >
                  <div className="p-2 rounded-lg border border-white/30 bg-white/10">
                    <ShoppingBasket className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-wide text-white/70">Collect</p>
                    <p className="font-bold text-white">{restaurant.name}</p>
                  </div>
                </div>
                
                {/* Address Card */}
                <div 
                  className="flex items-center gap-4 rounded-2xl px-6 py-4 flex-1 border-2 border-teal-400/50"
                  style={{ background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.9) 0%, rgba(15, 118, 110, 0.9) 100%)' }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white/80" />
                    <span className="text-white text-sm">{restaurant.address || "Address not set"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Category Pills Bar - Dark Navy */}
          <div className="py-3 px-4" style={{ background: '#0f172a' }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollCategories('left')}
                  className="shrink-0 p-2 rounded-full border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 transition-all"
                  data-testid="button-category-left-spicy"
                >
                  <ChevronLeft className="h-5 w-5 text-cyan-400" />
                </button>
                
                <div 
                  ref={categoryScrollRef}
                  className="flex-1 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex items-center gap-2 min-w-max">
                    {availableCategories.map((category, index) => {
                      const pillColors = [
                        'bg-red-600 hover:bg-red-500',
                        'bg-slate-600 hover:bg-slate-500',
                        'bg-emerald-600 hover:bg-emerald-500',
                        'bg-blue-600 hover:bg-blue-500',
                        'bg-orange-600 hover:bg-orange-500',
                        'bg-red-700 hover:bg-red-600',
                        'bg-slate-700 hover:bg-slate-600',
                        'bg-amber-600 hover:bg-amber-500',
                      ];
                      const colorClass = pillColors[index % pillColors.length];
                      return (
                        <button
                          key={category.id}
                          onClick={() => scrollToCategory(category.id)}
                          className={`px-5 py-2 rounded-full text-sm font-medium text-white transition-all whitespace-nowrap shadow-md ${colorClass}`}
                          data-testid={`tab-${category.id}`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  onClick={() => scrollCategories('right')}
                  className="shrink-0 p-2 rounded-full border border-cyan-500/50 bg-cyan-500/20 hover:bg-cyan-500/30 transition-all"
                  data-testid="button-category-right-spicy"
                >
                  <ChevronRight className="h-5 w-5 text-cyan-400" />
                </button>
                
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="shrink-0 p-2.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition-all"
                >
                  <Search className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && (
            <div className="p-4" style={{ background: '#1e3a5f' }}>
              <div className="max-w-5xl mx-auto">
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hello Mumbai Theme Header - Hide when cards mode is enabled */}
      {isHelloMumbaiTheme && !showCategoryCards && (
        <div className="z-50">
          {/* Top Navigation Bar - Black */}
          <div className="py-3 px-4" style={{ background: '#000000', borderBottom: '1px solid rgba(255, 165, 0, 0.3)' }}>
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <button 
                onClick={() => navigate(welcomeUrl)}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">BACK</span>
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => openBooking()}
                  className="px-4 py-2 rounded-lg border border-orange-500/50 text-orange-400 text-sm font-medium hover:bg-orange-500/10 transition-all"
                  data-testid="button-booking"
                >
                  Booking
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-4 py-2 text-white/80 text-sm font-medium hover:text-orange-400 transition-colors flex items-center gap-2"
                  data-testid="button-login"
                >
                  <User className="h-4 w-4" />
                  Log in &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Main Hero Section - Black with Orange */}
          <div 
            className="py-10 px-4"
            style={{ background: '#000000' }}
          >
            <div className="max-w-5xl mx-auto text-center">
              {/* Logo */}
              {restaurant.logoUrl && (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name} 
                  className="h-32 mx-auto mb-6 object-contain"
                />
              )}
              
              {/* Restaurant Name */}
              <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: '#FFA500' }}>
                {restaurant.name}
              </h1>
              
              {/* Tagline */}
              <p className="text-white/80 text-lg mb-2">
                {restaurant.tagline || restaurant.cuisineType || "Restaurant"}
              </p>
              
              {/* Address */}
              <div className="flex items-center justify-center gap-2 text-orange-400/80">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{restaurant.address || "Address not set"}</span>
              </div>
              
              {/* Phone */}
              {restaurant.phone && (
                <div className="flex items-center justify-center gap-2 text-orange-400/80 mt-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Category Pills Bar - Black with Orange accent */}
          <div className="py-3 px-4" style={{ background: '#000000', borderTop: '1px solid rgba(255, 165, 0, 0.3)' }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollCategories('left')}
                  className="shrink-0 p-2 rounded-full border border-orange-500/50 bg-orange-500/20 hover:bg-orange-500/30 transition-all"
                  data-testid="button-category-left-mumbai"
                >
                  <ChevronLeft className="h-5 w-5 text-orange-400" />
                </button>
                
                <div 
                  ref={categoryScrollRef}
                  className="flex-1 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex items-center gap-2 min-w-max">
                    {availableCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className="px-5 py-2 rounded-full text-sm font-medium text-white transition-all whitespace-nowrap shadow-md bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400"
                        data-testid={`tab-${category.id}`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => scrollCategories('right')}
                  className="shrink-0 p-2 rounded-full border border-orange-500/50 bg-orange-500/20 hover:bg-orange-500/30 transition-all"
                  data-testid="button-category-right-mumbai"
                >
                  <ChevronRight className="h-5 w-5 text-orange-400" />
                </button>
                
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="shrink-0 p-2.5 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 transition-all"
                >
                  <Search className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && (
            <div className="p-4" style={{ background: '#1a1a1a' }}>
              <div className="max-w-5xl mx-auto">
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restaurant Header - Non-Tawa themes (excluding Spicy, Hello Mumbai, Mujeeb Sweets, and Cards mode) */}
      {!isSpicyTheme && !isHelloMumbaiTheme && !isMujeebSweetsTheme && !showCategoryCards && (
      <header 
        className={isRoyalTheme ? "border-b border-yellow-500/20 relative overflow-hidden" : isDixyTheme ? "relative overflow-hidden border-b border-white/10" : hasGenericTheme ? "border-b relative overflow-hidden" : "bg-white border-b border-gray-100"}
        style={isRoyalTheme ? { background: 'linear-gradient(180deg, #0c0a1d 0%, #1a1040 25%, #2d1b69 50%, #1a1040 75%, #0c0a1d 100%)' } : isDixyTheme ? { background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.9) 50%, rgba(30, 27, 75, 0.95) 100%)' } : hasGenericTheme ? { background: genericTheme.colors.background, borderColor: genericTheme.colors.accent + '40' } : {}}
      >
        {/* Royal decorative elements */}
        {isRoyalTheme && (
          <>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #eab308 0%, transparent 25%), radial-gradient(circle at 80% 50%, #eab308 0%, transparent 25%)' }}></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
          </>
        )}
        <div className="max-w-5xl mx-auto px-4 py-6 relative">
          {isRoyalTheme ? (
            <div className="text-center mb-6">
              <div className="inline-block">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="h-px w-20 bg-gradient-to-r from-transparent to-yellow-400"></div>
                  <span className="text-yellow-300 text-xs tracking-[0.4em] uppercase font-medium">✦ Welcome to ✦</span>
                  <div className="h-px w-20 bg-gradient-to-l from-transparent to-yellow-400"></div>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                  {restaurant.name}
                </h1>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="text-yellow-400 text-3xl animate-pulse">👑</span>
                  <div className="text-center">
                    <span className="text-yellow-100 text-base font-semibold tracking-wide block">Authentic Afghan Cuisine</span>
                    <span className="text-yellow-300/60 text-xs tracking-widest uppercase">Premium Quality</span>
                  </div>
                  <span className="text-yellow-400 text-3xl animate-pulse">👑</span>
                </div>
                
                {/* PWA Install Button for Royal Theme */}
                {showInstallButton && !isPWAInstalled && (
                  <button 
                    onClick={handleInstallClick}
                    className="mt-4 px-6 py-2 rounded-full flex items-center gap-2 mx-auto font-bold text-sm bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-purple-900 hover:from-yellow-400 hover:to-yellow-400 transition-all shadow-lg animate-pulse"
                    data-testid="button-install-app-royal-header"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Install App</span>
                  </button>
                )}
              </div>
            </div>
          ) : isDixyTheme ? (
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                <span className="text-sm font-medium text-white/90">Premium Quality Since Day One</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent drop-shadow-2xl mb-3">
                {restaurant.name}
              </h1>
              <p className="text-lg bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent font-medium">
                Fresh • Crispy • Delicious
              </p>
            </motion.div>
          ) : isSpicyTheme ? (
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                <span className="text-sm font-medium text-white/90">🔥 Authentic Peri Peri 🔥</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 via-green-300 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl mb-3">
                {restaurant.name}
              </h1>
              <p className="text-lg bg-gradient-to-r from-green-300 via-white to-red-300 bg-clip-text text-transparent font-medium">
                Spicy • Fresh • Delicious
              </p>
            </motion.div>
          ) : hasGenericTheme ? (
            <h1 className="text-3xl font-bold mb-6" style={{ color: genericTheme.colors.text }}>{restaurant.name}</h1>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{restaurant.name}</h1>
          )}
          
          {/* Info Cards Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Collect Info Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`flex items-start gap-3 rounded-2xl p-4 flex-1 transition-all ${isRoyalTheme ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-yellow-500/30' : isDixyTheme ? 'card-3d-luxury backdrop-blur-md' : isSpicyTheme ? 'backdrop-blur-md border border-white/20' : hasGenericTheme ? 'border' : 'bg-gray-50'}`}
              style={isSpicyTheme ? { background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(30, 58, 95, 0.9) 100%)' } : hasGenericTheme ? { background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' } : {}}
            >
              <div className={`rounded-xl p-3 ${isRoyalTheme ? 'bg-yellow-500/20 border border-yellow-400/40' : isDixyTheme ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg' : isSpicyTheme ? 'bg-white/20 border border-white/30' : hasGenericTheme ? 'border' : 'bg-white border border-gray-200'}`} style={hasGenericTheme ? { background: genericTheme.colors.primary + '20', borderColor: genericTheme.colors.accent + '40' } : {}}>
                <ShoppingBasket className={`h-5 w-5 ${isRoyalTheme ? 'text-yellow-300' : isDixyTheme ? 'text-white' : isSpicyTheme ? 'text-white' : ''}`} style={hasGenericTheme ? { color: genericTheme.colors.primary } : {}} />
              </div>
              <div className="flex-1">
                <p className={`text-xs uppercase tracking-wide ${isRoyalTheme ? 'text-yellow-300/80' : isDixyTheme ? 'text-purple-300' : isSpicyTheme ? 'text-green-300' : hasGenericTheme ? '' : 'text-gray-500'}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>Collect</p>
                <p className={`font-semibold ${isRoyalTheme ? 'text-yellow-100' : isDixyTheme ? 'text-white' : isSpicyTheme ? 'text-white' : hasGenericTheme ? '' : 'text-gray-900'}`} style={hasGenericTheme ? { color: genericTheme.colors.text } : {}}>{restaurant.name}</p>
              </div>
            </motion.div>
            
            {/* Address Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center gap-6 rounded-2xl p-4 ${isRoyalTheme ? 'bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-yellow-500/30' : isDixyTheme ? 'card-3d-luxury backdrop-blur-md' : isSpicyTheme ? 'backdrop-blur-md border border-white/20' : hasGenericTheme ? 'border' : 'bg-gray-50'}`}
              style={isSpicyTheme ? { background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.9) 0%, rgba(34, 197, 94, 0.9) 100%)' } : hasGenericTheme ? { background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' } : {}}
            >
              <div className={`flex items-center gap-2 ${isRoyalTheme ? 'text-yellow-200' : isDixyTheme ? 'text-white/90' : isSpicyTheme ? 'text-white' : ''}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>
                <MapPin className={`h-4 w-4 ${isRoyalTheme ? 'text-yellow-400' : isDixyTheme ? 'text-red-400' : isSpicyTheme ? 'text-green-300' : ''}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}} />
                <span className="text-sm">{restaurant.address || "Address not set"}</span>
              </div>
              {!isSpicyTheme && (
                <div className={`border-l pl-6 ${isRoyalTheme ? 'border-yellow-500/40' : isDixyTheme ? 'border-white/20' : hasGenericTheme ? '' : 'border-gray-300'}`} style={hasGenericTheme ? { borderColor: genericTheme.colors.accent + '40' } : {}}>
                  <p className={`text-xs ${isRoyalTheme ? 'text-yellow-300/80' : isDixyTheme ? 'text-purple-300' : hasGenericTheme ? '' : 'text-gray-500'}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>Minimum spend</p>
                  <p className={`font-bold ${isRoyalTheme ? 'text-yellow-100' : isDixyTheme ? 'text-white' : hasGenericTheme ? '' : 'text-gray-900'}`} style={hasGenericTheme ? { color: genericTheme.colors.text } : {}}>{currencySymbol}1.00</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Voucher Banner - Dynamic from branch dashboard */}
          {promotion && promotion.isActive && (
            <div 
              className={`rounded-xl p-4 flex items-center gap-4 ${isRoyalTheme ? 'shadow-lg shadow-purple-900/30 border border-yellow-400/50' : 'shadow-sm'}`}
              style={isRoyalTheme ? { background: 'linear-gradient(135deg, #2d1b69 0%, #3d2180 50%, #2d1b69 100%)' } : { backgroundColor: promotion.backgroundColor || "#dc2626" }}
              data-testid="promotional-banner"
            >
              {isRoyalTheme && (
                <div className="text-3xl">🎁</div>
              )}
              <div className="flex-1">
                <p 
                  className={`font-semibold text-lg ${isRoyalTheme ? 'text-yellow-100' : ''}`}
                  style={!isRoyalTheme ? { color: promotion.textColor || "#ffffff" } : {}}
                >
                  {promotion.headline}
                </p>
                {promotion.subtext && (
                  <p 
                    className={`text-sm mt-1 ${isRoyalTheme ? 'text-yellow-200/90' : 'opacity-90'}`}
                    style={!isRoyalTheme ? { color: promotion.textColor || "#ffffff" } : {}}
                  >
                    {promotion.subtext}
                  </p>
                )}
              </div>
              {isRoyalTheme && (
                <div className="text-3xl">👑</div>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs - Flipdish Style Horizontal Pills (hide when sidebar mode is enabled and for themes with custom category nav) */}
        {!isDixyTheme && !isMujeebSweetsTheme && !isSpicyTheme && !showCategorySidebar && !showCategoryCards && (
        <div 
          className={`z-40 ${isRoyalTheme ? 'border-b border-yellow-500/20 sticky top-0' : isSpicyTheme ? 'border-b border-white/20' : hasGenericTheme ? 'border-b sticky top-0' : 'bg-white sticky top-0'}`}
          style={isRoyalTheme ? { background: 'linear-gradient(90deg, #0c0a1d 0%, #1a1040 50%, #0c0a1d 100%)' } : isSpicyTheme ? { background: 'linear-gradient(90deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' } : hasGenericTheme ? { background: genericTheme.colors.headerBg, borderColor: genericTheme.colors.accent } : {}}
        >
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-2 py-3">
              {/* Left Scroll Button - Royal Theme */}
              {isRoyalTheme && (
                <button 
                  onClick={() => scrollCategories('left')}
                  className="shrink-0 p-2 rounded-full border border-yellow-500/50 bg-purple-900/30 hover:bg-purple-800/50 transition-all"
                  data-testid="button-category-left-royal"
                >
                  <ChevronLeft className="h-5 w-5 text-yellow-300" />
                </button>
              )}
              
              {/* Scrollable Categories - Flipdish Pills */}
              <div 
                ref={categoryScrollRef}
                className={`flex-1 overflow-x-auto ${isRoyalTheme ? 'scrollbar-thin' : 'scrollbar-hide'}`}
                style={isRoyalTheme ? { scrollbarWidth: 'thin', scrollbarColor: '#c9a646 #1a1040' } : { scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex items-center gap-2 min-w-max pb-1">
                  {availableCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => isDixyTheme ? switchToCategory(category.id) : scrollToCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                        isRoyalTheme 
                          ? 'border-yellow-500/40 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 text-yellow-100 hover:from-purple-700/60 hover:to-indigo-700/60 hover:border-yellow-400' 
                          : isDixyTheme 
                            ? activeCategoryId === category.id
                              ? 'bg-[#E31E24] text-white border-[#E31E24]'
                              : 'border-red-200 bg-white text-gray-700 hover:bg-red-50 hover:text-[#E31E24] hover:border-red-300'
                            : isSpicyTheme
                              ? 'border-white/30 bg-gradient-to-r from-red-600/80 to-green-600/80 text-white hover:from-red-500 hover:to-green-500 hover:border-white/50'
                              : hasGenericTheme
                                ? ''
                                : 'bg-white border-gray-300 text-gray-700 hover:border-[#22c55e] hover:text-[#22c55e]'
                      }`}
                      style={hasGenericTheme ? { 
                        background: genericTheme.colors.cardBg, 
                        borderColor: genericTheme.colors.accent,
                        color: genericTheme.colors.text
                      } : {}}
                      data-testid={`tab-${category.id}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Right Scroll Button - Royal Theme */}
              {isRoyalTheme && (
                <button 
                  onClick={() => scrollCategories('right')}
                  className="shrink-0 p-2 rounded-full border border-yellow-500/50 bg-purple-900/30 hover:bg-purple-800/50 transition-all"
                  data-testid="button-category-right-royal"
                >
                  <ChevronRight className="h-5 w-5 text-yellow-300" />
                </button>
              )}
              
              {/* Search Button */}
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`shrink-0 p-2.5 rounded-full border transition-all ${isRoyalTheme ? 'border-yellow-500/50 bg-purple-900/30 hover:bg-purple-800/50' : isSpicyTheme ? 'border-white/30 bg-white/10 hover:bg-white/20' : hasGenericTheme ? '' : 'border-gray-300 bg-white hover:border-[#22c55e]'}`}
                style={hasGenericTheme ? { borderColor: genericTheme.colors.accent, background: genericTheme.colors.cardBg } : {}}
              >
                <Search className={`h-5 w-5 ${isRoyalTheme ? 'text-yellow-300' : isSpicyTheme ? 'text-white' : ''}`} style={hasGenericTheme ? { color: genericTheme.colors.text } : {}} />
              </button>
              
              {/* Install App Button */}
              {showInstallButton && !isPWAInstalled && (
                <button 
                  onClick={handleInstallClick}
                  className={`shrink-0 px-3 py-2 rounded-full flex items-center gap-1.5 font-bold text-sm transition-all shadow-lg animate-pulse ${
                    isRoyalTheme 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-purple-900 hover:from-yellow-400 hover:to-amber-400' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  }`}
                  data-testid="button-install-app-royal"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Install App</span>
                </button>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className={`border-t p-4 ${isRoyalTheme ? 'border-yellow-500/20 bg-gradient-to-r from-purple-900/30 to-indigo-900/30' : isSpicyTheme ? 'border-white/20 bg-gradient-to-r from-red-900/50 to-navy-900/50' : 'border-gray-100 bg-gray-50'}`}
            style={isSpicyTheme ? { background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.3) 0%, rgba(30, 58, 95, 0.3) 100%)' } : {}}>
            <div className="max-w-5xl mx-auto">
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`max-w-md ${isRoyalTheme ? 'bg-white/10 border-yellow-500/40 text-yellow-100 placeholder:text-yellow-200/50' : isSpicyTheme ? 'bg-gray-200 border-gray-400 text-gray-900 placeholder:text-gray-500' : 'bg-white'}`}
              />
            </div>
          </div>
        )}
      </header>
      )}

      {/* Generic Theme Hero GIF Banner */}
      {hasGenericTheme && genericTheme.heroGif && (
        <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
          <img 
            src={genericTheme.heroGif} 
            alt="Hero Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, transparent 0%, ${genericTheme.colors.background}cc 80%, ${genericTheme.colors.background} 100%)` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            {restaurant?.logoUrl && (
              <img 
                src={restaurant.logoUrl} 
                alt={restaurant?.name} 
                className="h-20 md:h-28 object-contain mb-4 drop-shadow-lg"
              />
            )}
            <h1 
              className="text-3xl md:text-5xl font-bold mb-2"
              style={{ color: genericTheme.colors.text, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
            >
              {restaurant?.name}
            </h1>
            <p 
              className="text-lg md:text-xl opacity-90"
              style={{ color: genericTheme.colors.textMuted }}
            >
              Order Online
            </p>
          </div>
        </div>
      )}

      {/* ============== MUJEEB SWEETS UNIQUE FULL-PAGE THEME ============== */}
      {isMujeebSweetsTheme && (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #f5576c 100%)' }}>
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(102, 126, 234, 0.95)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <button 
                onClick={() => navigate(welcomeUrl)}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium text-sm">Back</span>
              </button>
              <div className="flex items-center gap-3">
                {restaurant?.logoUrl && (
                  <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
                )}
                <h1 className="text-lg font-bold text-white">{restaurant?.name}</h1>
              </div>
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>
            {showSearch && (
              <div className="px-4 pb-3 max-w-md mx-auto">
                <Input
                  placeholder="Search sweets & bakes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full border-2 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                />
              </div>
            )}
          </div>

          {/* Category Pills - Horizontal Scroll */}
          <div className="py-4 px-4 sticky top-[60px] z-40" style={{ background: 'rgba(118, 75, 162, 0.9)', backdropFilter: 'blur(10px)' }}>
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => scrollCategories('left')}
                  className="shrink-0 p-2 rounded-full transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
                <div 
                  ref={categoryScrollRef}
                  className="flex-1 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex items-center gap-3 min-w-max px-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap hover:scale-105"
                        style={{ 
                          background: activeCategoryId === category.id 
                            ? 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)' 
                            : 'rgba(255,255,255,0.15)',
                          color: activeCategoryId === category.id ? '#764ba2' : '#fff',
                          boxShadow: activeCategoryId === category.id ? '0 4px 15px rgba(255, 167, 81, 0.4)' : 'none'
                        }}
                        data-testid={`tab-${category.id}`}
                      >
                        {category.icon && <span className="mr-1">{category.icon}</span>}
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => scrollCategories('right')}
                  className="shrink-0 p-2 rounded-full transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items Section - FoodFun Style Cards */}
          <div className="py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-12">
              {availableCategories.map((category) => {
                const items = getItemsByCategory(category.id);
                if (items.length === 0) return null;

                return (
                  <div key={category.id} id={`category-${category.id}`} className="scroll-mt-40">
                    {/* Category Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                      >
                        <span className="text-4xl mb-2 block">{category.icon || '🍰'}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-1" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                          {category.name}
                        </h3>
                        <p className="text-white/70 text-sm">{items.length} delicious items</p>
                      </motion.div>
                    </div>

                    {/* Items Grid - FoodFun Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className={`rounded-2xl overflow-hidden transition-all duration-300 group ${item.available === false ? 'opacity-60' : 'cursor-pointer hover:scale-[1.03] hover:shadow-2xl'}`}
                          style={{ 
                            background: 'rgba(255,255,255,0.95)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                          }}
                          data-testid={`menu-item-${item.id}`}
                        >
                          {/* Product Image */}
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={item.image || getItemImage(category.id, index)}
                              alt={item.name}
                              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${item.available === false ? 'grayscale' : ''}`}
                            />
                            {item.available === false && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="px-4 py-2 rounded-full text-sm font-bold bg-red-500 text-white">SOLD OUT</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="p-5">
                            <h4 className="font-bold text-lg text-gray-800 mb-2">{item.name}</h4>
                            {item.description && (
                              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{item.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold" style={{ color: '#764ba2' }}>
                                {currencySymbol}{item.price}
                              </span>
                              {item.available !== false && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                  style={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#fff',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                  }}
                                  data-testid={`add-item-${item.id}`}
                                >
                                  <Plus className="h-4 w-4 inline mr-1" /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Spacing for Cart */}
          <div className="h-32"></div>
        </div>
      )}

      {/* Menu Content - Hidden for Mujeeb Sweets which has its own full-page theme */}
      {!isMujeebSweetsTheme && (
      <main id="menu-content-section" className={isDixyTheme ? "w-full max-w-6xl mx-auto py-0 px-0" : showCategorySidebar ? "max-w-6xl mx-auto px-4 py-6" : "max-w-5xl mx-auto px-4 py-6"} style={isSpicyTheme ? { background: '#0f172a' } : {}}>
        
        {/* Generic Theme Sidebar Layout */}
        {showCategorySidebar && hasGenericTheme && (
          <div className="flex gap-6 min-h-[600px]">
            {/* Category Sidebar */}
            <div 
              className="hidden md:block w-56 flex-shrink-0 sticky top-[80px] self-start max-h-[calc(100vh-100px)] overflow-y-auto rounded-lg border"
              style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
            >
              <div className="py-4">
                <h3 
                  className="px-5 py-3 text-sm font-bold uppercase tracking-widest border-b"
                  style={{ color: genericTheme.colors.textMuted, borderColor: genericTheme.colors.accent + '20' }}
                >
                  Select Category
                </h3>
                {hierarchicalCategories.map((parent) => {
                  const hasChildren = parent.children && parent.children.length > 0;
                  const isExpanded = expandedSidebarParents.includes(parent.id);
                  const isParentActive = activeCategoryId === parent.id || 
                    (parent.children?.some(child => activeCategoryId === child.id));
                  
                  return (
                    <div key={parent.id}>
                      {/* Parent Category Button */}
                      <button
                        onClick={() => {
                          playClick();
                          if (hasChildren) {
                            toggleSidebarParent(parent.id);
                          } else {
                            setActiveCategoryId(parent.id);
                            scrollToCategory(parent.id);
                          }
                        }}
                        onMouseEnter={() => playHover()}
                        className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all border-l-4 flex items-center justify-between ${
                          isParentActive
                            ? 'border-l-4'
                            : 'border-transparent hover:border-l-2'
                        }`}
                        style={{ 
                          color: isParentActive ? genericTheme.colors.primary : genericTheme.colors.text,
                          borderLeftColor: isParentActive ? genericTheme.colors.primary : 'transparent',
                          background: isParentActive ? genericTheme.colors.primary + '10' : 'transparent'
                        }}
                        data-testid={`sidebar-category-${parent.id}`}
                      >
                        <span>{parent.name}</span>
                        {hasChildren && (
                          <svg 
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                      
                      {/* Child Categories Dropdown */}
                      {hasChildren && isExpanded && (
                        <div 
                          className="ml-4 border-l-2"
                          style={{ borderColor: genericTheme.colors.accent + '40' }}
                        >
                          {parent.children?.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => {
                                playClick();
                                setActiveCategoryId(child.id);
                                scrollToCategory(child.id);
                              }}
                              onMouseEnter={() => playHover()}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                                activeCategoryId === child.id
                                  ? 'font-semibold'
                                  : 'font-normal hover:bg-opacity-50'
                              }`}
                              style={{ 
                                color: activeCategoryId === child.id ? genericTheme.colors.primary : genericTheme.colors.text,
                                background: activeCategoryId === child.id ? genericTheme.colors.primary + '15' : 'transparent'
                              }}
                              data-testid={`sidebar-subcategory-${child.id}`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Category Sidebar */}
            <div 
              className="md:hidden fixed left-0 top-[60px] z-40 w-[100px] rounded-r-lg border-r"
              style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
            >
              <ScrollArea className="h-[calc(100vh-60px)]">
                <div className="py-2 pb-[120px]">
                  <h3 
                    className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider border-b text-center"
                    style={{ color: genericTheme.colors.textMuted, borderColor: genericTheme.colors.accent + '20' }}
                  >
                    Select
                  </h3>
                  {hierarchicalCategories.map((parent) => {
                    const hasChildren = parent.children && parent.children.length > 0;
                    const isExpanded = expandedSidebarParents.includes(parent.id);
                    const isParentActive = activeCategoryId === parent.id || 
                      (parent.children?.some(child => activeCategoryId === child.id));
                    
                    return (
                      <div key={parent.id}>
                        {/* Parent Category Button */}
                        <button
                          onClick={() => {
                            playClick();
                            if (hasChildren) {
                              toggleSidebarParent(parent.id);
                            } else {
                              setActiveCategoryId(parent.id);
                              scrollToCategory(parent.id);
                            }
                          }}
                          className={`w-full text-left px-2 py-2 text-[10px] leading-tight font-medium transition-all border-l-2 whitespace-normal break-words flex items-center justify-between`}
                          style={{ 
                            color: isParentActive ? genericTheme.colors.primary : genericTheme.colors.text,
                            borderLeftColor: isParentActive ? genericTheme.colors.primary : 'transparent',
                            background: isParentActive ? genericTheme.colors.primary + '10' : 'transparent'
                          }}
                          data-testid={`mobile-sidebar-category-${parent.id}`}
                        >
                          <span className="flex-1">{parent.name}</span>
                          {hasChildren && (
                            <svg 
                              className={`w-3 h-3 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Child Categories Dropdown */}
                        {hasChildren && isExpanded && (
                          <div 
                            className="ml-2 border-l"
                            style={{ borderColor: genericTheme.colors.accent + '40' }}
                          >
                            {parent.children?.map((child) => (
                              <button
                                key={child.id}
                                onClick={() => {
                                  playClick();
                                  setActiveCategoryId(child.id);
                                  scrollToCategory(child.id);
                                }}
                                className={`w-full text-left px-2 py-1.5 text-[9px] leading-tight transition-all whitespace-normal break-words`}
                                style={{ 
                                  color: activeCategoryId === child.id ? genericTheme.colors.primary : genericTheme.colors.text,
                                  background: activeCategoryId === child.id ? genericTheme.colors.primary + '15' : 'transparent',
                                  fontWeight: activeCategoryId === child.id ? 600 : 400
                                }}
                                data-testid={`mobile-sidebar-subcategory-${child.id}`}
                              >
                                {child.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Content - Items */}
            <div className="flex-1 py-4 w-full overflow-x-hidden pl-[105px] pr-3 md:pl-0 md:pr-0">
              {/* Items Header */}
              <div 
                className="flex items-center justify-between py-4 border-b sticky top-[80px] z-20 backdrop-blur-sm mx-1 rounded-lg px-4"
                style={{ background: genericTheme.colors.cardBg + 'dd', borderColor: genericTheme.colors.accent + '40' }}
              >
                <h2 className="text-lg font-bold" style={{ color: genericTheme.colors.text }}>Items</h2>
                <button 
                  className="flex items-center gap-2 text-sm transition-colors px-3 py-1.5 rounded-lg border" 
                  style={{ color: genericTheme.colors.text, borderColor: genericTheme.colors.accent }}
                  data-testid="button-allergy-info"
                  onClick={() => { playClick(); setShowAllergenMatrix(true); }}
                  onMouseEnter={() => playHover()}
                >
                  <span 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: genericTheme.colors.primary, color: genericTheme.colors.headerText }}
                  >
                    i
                  </span>
                  Allergy
                </button>
              </div>

              {/* Category Sections */}
              <div className="py-4 space-y-8">
                {availableCategories.map((category, catIndex) => {
                  const items = getItemsByCategory(category.id);
                  if (items.length === 0) return null;

                  return (
                    <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                      {/* Category Header */}
                      <div 
                        className="px-5 py-4 rounded-t-2xl mb-0 shadow-sm"
                        style={{ background: genericTheme.colors.primary }}
                      >
                        <h3 className="font-bold text-lg" style={{ color: genericTheme.colors.headerText }}>{category.name}</h3>
                      </div>

                      {/* Items Grid */}
                      <div 
                        className="rounded-b-2xl border border-t-0 p-4"
                        style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map((item, index) => (
                            <div
                              key={item.id}
                              className={`rounded-xl overflow-hidden transition-all duration-200 group flex border ${item.available === false ? 'opacity-60' : 'cursor-pointer hover:shadow-md'}`}
                              style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
                              data-testid={`menu-item-${item.id}`}
                            >
                              {/* Product Image */}
                              <div className="relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg m-2 bg-gray-100">
                                <img 
                                  src={item.image || getItemImage(category.id, index)}
                                  alt={item.name}
                                  className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                                />
                                {item.available === false && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                    <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Info */}
                              <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                                <div>
                                  <h3 
                                    className="font-semibold text-[15px] leading-tight"
                                    style={{ color: item.available === false ? genericTheme.colors.textMuted : genericTheme.colors.text }}
                                  >
                                    {item.name}
                                  </h3>
                                  {item.description && (
                                    <p 
                                      className="text-xs mt-1 line-clamp-2 leading-relaxed"
                                      style={{ color: genericTheme.colors.textMuted }}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-end justify-between mt-2">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide" style={{ color: genericTheme.colors.textMuted }}>FROM</p>
                                    <p className="font-bold text-[15px]" style={{ color: genericTheme.colors.accent }}>{currencySymbol}{item.price}</p>
                                  </div>
                                  {item.available !== false && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item);
                                      }}
                                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                                      style={{ background: genericTheme.colors.primary, color: genericTheme.colors.headerText }}
                                      data-testid={`add-item-${item.id}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Hello Mumbai Menu Items Section */}
        {isHelloMumbaiTheme && !showCategorySidebar && !showCategoryCards && (
          <div className="py-4" style={{ background: '#1a1a1a' }}>
            <div className="max-w-5xl mx-auto space-y-8">
              {availableCategories.map((category, catIndex) => {
                const items = getItemsByCategory(category.id);
                if (items.length === 0) return null;

                return (
                  <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                    {/* Category Header */}
                    <div 
                      className="px-5 py-4 rounded-t-2xl mb-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)' }}
                    >
                      <h3 className="font-bold text-lg text-black">{category.name}</h3>
                    </div>

                    {/* Items Grid */}
                    <div 
                      className="rounded-b-2xl border border-t-0 p-4"
                      style={{ background: '#2a2a2a', borderColor: 'rgba(255, 165, 0, 0.3)' }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item, index) => (
                          <div
                            key={item.id}
                            className={`rounded-xl overflow-hidden transition-all duration-200 group flex border ${item.available === false ? 'opacity-60' : 'cursor-pointer hover:shadow-md'}`}
                            style={{ background: '#333333', borderColor: 'rgba(255, 165, 0, 0.2)' }}
                            data-testid={`menu-item-${item.id}`}
                          >
                            {/* Product Image */}
                            <div className="relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg m-2 bg-gray-800">
                              <img 
                                src={item.image || getItemImage(category.id, index)}
                                alt={item.name}
                                className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                              />
                              {item.available === false && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                  <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                              <div>
                                <h3 
                                  className="font-semibold text-[15px] leading-tight"
                                  style={{ color: item.available === false ? '#666' : '#fff' }}
                                >
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p 
                                    className="text-xs mt-1 line-clamp-2 leading-relaxed"
                                    style={{ color: '#999' }}
                                  >
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-end justify-between mt-2">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wide" style={{ color: '#888' }}>FROM</p>
                                  <p className="font-bold text-[15px]" style={{ color: '#FFA500' }}>{currencySymbol}{item.price}</p>
                                </div>
                                {item.available !== false && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(item);
                                    }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                                    style={{ background: '#FFA500', color: '#000' }}
                                    data-testid={`add-item-${item.id}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cards Category Layout - Beautiful Icon Cards */}
        {showCategoryCards && (
          <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #8B0000 0%, #DC143C 30%, #FF6347 100%)' }}>
            {/* Cards Layout Header with Logo */}
            <div className="py-6 px-4" style={{ background: '#000000' }}>
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <button 
                  onClick={() => navigate(welcomeUrl)}
                  className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">BACK</span>
                </button>
                <div className="flex items-center gap-3">
                  {restaurant?.logoUrl && (
                    <img src={restaurant.logoUrl} alt={restaurant?.name} className="h-12 object-contain" />
                  )}
                  <h1 className="text-xl font-bold text-orange-400">{restaurant?.name}</h1>
                </div>
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 rounded-full border border-orange-500/50 text-orange-400 hover:bg-orange-500/20 transition-all"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              {showSearch && (
                <div className="mt-4 max-w-md mx-auto">
                  <Input
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              )}
            </div>
            
            {/* Category Cards Title */}
            <div className="text-center py-8 px-4">
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Our Menu</h2>
              <p className="text-white/80 text-sm">Select a category to explore our delicious offerings</p>
            </div>
            
            {/* Category Grid */}
            {!activeCategoryId ? (
              <div className="max-w-5xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {availableCategories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        playClick();
                        setActiveCategoryId(category.id);
                      }}
                      onMouseEnter={() => playHover()}
                      className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                      data-testid={`card-category-${category.id}`}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                          <span className="text-3xl md:text-4xl">{category.icon || '🍽️'}</span>
                        </div>
                        <h3 className="text-white font-bold text-sm md:text-base drop-shadow">{category.name}</h3>
                        <p className="text-white/60 text-xs">
                          {menuItems.filter(item => item.category === category.id || (item as any).categorySlug === category.id).length} items
                        </p>
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              /* Items View when category selected */
              <div className="max-w-5xl mx-auto px-4 pb-12">
                {/* Back Button */}
                <button
                  onClick={() => {
                    playClick();
                    setActiveCategoryId(null);
                  }}
                  className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Back to Categories</span>
                </button>

                {/* Active Category Title */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                    <span className="text-3xl">{availableCategories.find(c => c.id === activeCategoryId)?.icon || '🍽️'}</span>
                    <h2 className="text-2xl font-bold text-white">{availableCategories.find(c => c.id === activeCategoryId)?.name}</h2>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems
                    .filter(item => item.category === activeCategoryId || (item as any).categorySlug === activeCategoryId)
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => {
                          playClick();
                          addToCart(item);
                        }}
                        className="group bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex">
                          {item.image && (
                            <div className="w-28 h-28 flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{item.name}</h3>
                              <p className="text-gray-500 text-sm line-clamp-2 mt-1">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-lg font-bold text-red-600">{currencySymbol}{item.price}</span>
                              {item.available !== false && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                                  data-testid={`add-item-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Royal Menu Header */}
        {isRoyalTheme && !showCategorySidebar && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-400"></div>
              <span className="text-2xl">✨</span>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                Our Royal Menu
              </h2>
              <span className="text-2xl">✨</span>
              <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent via-yellow-500 to-yellow-400"></div>
            </div>
            <p className="text-yellow-200/70 text-sm">Authentic Afghan Cuisine - Fit for Royalty</p>
          </div>
        )}

        {/* Dixy Two-Column Menu Layout */}
        {isDixyTheme ? (
          <div className="flex gap-0 min-h-[600px] relative z-10 w-full">
            {/* Left Sidebar - Categories */}
            <motion.div 
              ref={sidebarRef}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden md:block w-60 flex-shrink-0 sticky top-[80px] self-start max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              style={{ background: DIXY_PREMIUM_THEME.gradient.sidebar }}
            >
              <div className="py-4">
                <h3 className="px-5 py-3 text-sm font-bold text-white/80 uppercase tracking-widest border-b border-white/10">Categories</h3>
                {availableCategories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    onClick={() => {
                      playClick();
                      setActiveCategoryId(category.id);
                      const element = document.getElementById(`dixy-category-${category.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    onMouseEnter={() => playHover()}
                    className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all border-l-4 ${
                      activeCategoryId === category.id
                        ? 'bg-gradient-to-r from-red-500/40 to-transparent text-white border-red-400 shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-purple-400/50'
                    }`}
                    data-testid={`sidebar-category-${category.id}`}
                  >
                    {category.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Mobile Category Sidebar - Fixed Left */}
            <div className="md:hidden fixed left-0 top-[60px] z-40 w-[100px]" style={{ background: DIXY_PREMIUM_THEME.gradient.sidebar }}>
              <ScrollArea className="h-[calc(100vh-60px)]">
                <div className="py-2 pb-[120px]">
                  <h3 className="px-2 py-2 text-[10px] font-bold text-white/80 uppercase tracking-wider border-b border-white/10 text-center">Menu</h3>
                  {availableCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        playClick();
                        setActiveCategoryId(category.id);
                        const element = document.getElementById(`dixy-category-${category.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className={`w-full text-left px-2 py-2 text-[10px] leading-tight font-medium transition-all border-l-2 whitespace-normal break-words ${
                        activeCategoryId === category.id
                          ? 'bg-gradient-to-r from-red-500/40 to-transparent text-white border-red-400'
                          : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                      data-testid={`mobile-sidebar-category-${category.id}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right Content - Items */}
            <div className="flex-1 py-4 w-full overflow-x-hidden pl-[105px] pr-3 md:pl-6 md:pr-6">
              {/* Items Header */}
              <div className="flex items-center justify-between py-4 border-b border-white/10 sticky top-[120px] md:top-[80px] z-20 backdrop-blur-sm mx-1" style={{ background: 'rgba(30, 27, 75, 0.7)' }}>
                <h2 className="text-lg font-bold text-white">Items</h2>
                <button 
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors btn-3d-premium px-3 py-1.5 rounded-lg" 
                  data-testid="button-allergy-info"
                  onClick={() => { playClick(); setShowAllergenMatrix(true); }}
                  onMouseEnter={() => playHover()}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-400 text-white flex items-center justify-center text-xs font-bold">i</span>
                  Allergy
                </button>
              </div>

              {/* Category Sections */}
              <div className="py-4 space-y-8">
                {availableCategories.map((category, catIndex) => {
                  const items = getItemsWithVariantsByCategory(category.id);
                  if (items.length === 0) return null;

                  return (
                    <motion.div 
                      key={category.id} 
                      id={`dixy-category-${category.id}`} 
                      className="scroll-mt-32"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + catIndex * 0.05 }}
                    >
                      {/* Category Header Banner */}
                      <div 
                        className="text-white px-5 py-4 rounded-t-2xl mb-0 shadow-lg"
                        style={{ background: DIXY_PREMIUM_THEME.gradient.categoryBanner }}
                      >
                        <h3 className="font-bold text-lg">{category.name}</h3>
                      </div>

                      {/* Items List */}
                      <div className="card-3d-luxury rounded-t-none rounded-b-2xl divide-y divide-white/10 overflow-hidden">
                        {items.map((item, index) => {
                          const hasVariants = item.variants && item.variants.length > 0;
                          
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.05 * index }}
                              className={`p-4 transition-all ${item.available === false ? 'opacity-60' : 'hover:bg-white/5 cursor-pointer'}`}
                              data-testid={`menu-item-${item.id}`}
                              onMouseEnter={() => playHover()}
                            >
                              <div className="flex gap-4">
                                {/* Product Image/Video/GIF */}
                                <div className="relative w-[75px] h-[75px] flex-shrink-0 rounded-xl overflow-hidden bg-white/10 ring-2 ring-white/20 shadow-lg">
                                  {item.videoUrl ? (
                                    <video 
                                      src={item.videoUrl}
                                      className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                    />
                                  ) : item.gifUrl ? (
                                    <img 
                                      src={item.gifUrl}
                                      alt={item.name}
                                      className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                    />
                                  ) : (
                                    <img 
                                      src={item.image || getItemImage(category.id, index)}
                                      alt={item.name}
                                      className={`w-full h-full object-cover ${item.available === false ? 'grayscale' : ''}`}
                                    />
                                  )}
                                  {item.available === false && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-bold text-[15px] leading-tight ${item.available === false ? 'text-white/50' : 'text-white'}`}>{item.name}</h4>
                                  {item.description && (
                                    <p className="text-sm text-white/60 mt-1 leading-snug">{item.description}</p>
                                  )}
                                  
                                  {/* Weight Info Display */}
                                  {(item as any).weight && (
                                    <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                                      <span className="font-medium">WEIGHT:</span>
                                      <span>{(item as any).weight}{(item as any).weightUnit || 'kg'}</span>
                                    </div>
                                  )}
                                  
                                  {/* Orange badge - meal indicator (hide if weight item) */}
                                  {!(item as any).weight && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs shadow-lg">
                                        <span className="text-[10px]">🍽</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Variant Dropdown (for weight options) */}
                                  {hasVariants && (item as any).variantLabel && item.available !== false ? (
                                    <div className="mt-2 space-y-2">
                                      <label className="text-xs font-medium text-white/70">{(item as any).variantLabel}</label>
                                      <select
                                        value={selectedVariants[item.id] || ''}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setSelectedVariants(prev => ({ ...prev, [item.id]: e.target.value }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-xs border border-white/20 rounded px-2 py-1.5 bg-white/10 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        data-testid={`select-variant-dixy-${item.id}`}
                                      >
                                        <option value="" className="bg-gray-800">-- Please Select --</option>
                                        {item.variants!.filter((v: any) => v.available !== false).map((variant) => (
                                          <option key={variant.id} value={variant.id} className="bg-gray-800">
                                            {variant.name} - {currencySymbol}{variant.price}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const variantId = selectedVariants[item.id];
                                          if (variantId) {
                                            const variant = item.variants!.find((v: any) => v.id === variantId);
                                            if (variant) {
                                              playClick();
                                              addVariantToCart(item, variant);
                                            }
                                          }
                                        }}
                                        disabled={!selectedVariants[item.id]}
                                        className="w-full text-xs px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors"
                                        data-testid={`add-to-cart-dixy-${item.id}`}
                                      >
                                        <ShoppingCart className="h-3 w-3" />
                                        ADD TO CART
                                      </button>
                                    </div>
                                  ) : hasVariants && !(item as any).variantLabel ? (
                                    <div className="mt-2 space-y-0">
                                      {item.variants!.map((variant) => (
                                        <div key={variant.id} className="flex items-center justify-between py-1">
                                          <span className={`text-[14px] font-bold ${(variant as any).available === false ? 'text-yellow-300/40 line-through' : 'text-yellow-300'}`}>{variant.name}</span>
                                          <div className="flex items-center gap-3">
                                            <span className={`font-bold text-[15px] ${(variant as any).available === false ? 'text-yellow-400/40' : 'text-yellow-400'}`} style={{ color: (variant as any).available === false ? 'rgba(250,204,21,0.4)' : '#facc15' }}>{currencySymbol}{variant.price}</span>
                                            {(variant as any).available === false ? (
                                              <span className="text-red-400 text-[10px] font-bold px-1.5 py-0.5 bg-red-500/20 rounded">SOLD OUT</span>
                                            ) : (
                                              <button
                                                onClick={(e) => { 
                                                  e.stopPropagation();
                                                  playClick();
                                                  addVariantToCart(item, variant);
                                                }}
                                                className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                                                data-testid={`add-variant-${variant.id}`}
                                              >
                                                <Plus className="h-4 w-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className="text-white/70 text-sm"></span>
                                      <div className="flex items-center gap-3">
                                        <span className={`font-semibold ${item.available === false ? 'text-white/40' : 'text-yellow-300'}`}>{currencySymbol}{item.price}</span>
                                        {item.available === false ? (
                                          <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                                        ) : (
                                          <button
                                            onClick={() => { playClick(); addToCart(item); }}
                                            className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                                            data-testid={`add-item-${item.id}`}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isRoyalTheme ? (
          /* Royal Theme - All Categories Visible with Horizontal Scroll Bar */
          <div>
            {/* All Categories Expanded - Royal Theme */}
            {availableCategories.map(category => {
              const items = getItemsByCategory(category.id);
              if (items.length === 0) return null;

              return (
                <div 
                  key={category.id} 
                  id={`category-${category.id}`}
                  className="mb-8"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-4 py-3 border-b border-yellow-500/30">
                    <div className="h-px flex-1 max-w-8 bg-gradient-to-r from-transparent to-yellow-400"></div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                      {category.name}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-yellow-400 to-transparent"></div>
                    <span className="text-yellow-400/60 text-sm">({items.length} items)</span>
                  </div>
                  
                  {/* Items Grid - Always Visible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded-xl overflow-hidden transition-all duration-200 group flex border bg-gradient-to-r from-purple-900/80 via-indigo-900/70 to-purple-900/80 ${item.available === false ? 'opacity-60 border-yellow-500/20' : 'cursor-pointer border-yellow-500/40 hover:border-yellow-400/60'}`}
                        data-testid={`menu-item-${item.id}`}
                      >
                        {/* Left - Product Image/Video/GIF */}
                        <div className="relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg m-2 bg-gradient-to-br from-purple-800 to-indigo-900">
                          {item.videoUrl ? (
                            <video 
                              src={item.videoUrl}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : item.gifUrl ? (
                            <img 
                              src={item.gifUrl}
                              alt={item.name}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <img 
                              src={item.image || getItemImage(category.id, index)}
                              alt={item.name}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                            />
                          )}
                          {item.available === false && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Right - Product Info */}
                        <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className={`font-semibold text-[15px] leading-tight ${item.available === false ? 'text-yellow-200/50' : 'text-yellow-200'}`}>{item.name}</h3>
                            {item.description && (
                              <p className="text-xs mt-1 line-clamp-2 leading-relaxed text-purple-200/70">{item.description}</p>
                            )}
                          </div>
                          {/* Variant Options or Single Price */}
                          {item.variants && item.variants.length > 0 ? (
                            <div className="mt-1 space-y-0">
                              {item.variants.map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between py-0.5">
                                  <span className={`text-[13px] font-bold ${(variant as any).available === false ? 'text-yellow-300/40 line-through' : 'text-yellow-300'}`}>{variant.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-[14px]`} style={{ color: (variant as any).available === false ? 'rgba(250,204,21,0.4)' : '#facc15' }}>{currencySymbol}{variant.price}</span>
                                    {item.available !== false && (variant as any).available !== false ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addVariantToCart(item, variant);
                                        }}
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-gradient-to-br from-yellow-500 to-yellow-400 text-purple-900"
                                        data-testid={`add-variant-${variant.id}`}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    ) : (variant as any).available === false ? (
                                      <span className="text-red-400 text-[10px] font-bold px-1.5 py-0.5 bg-red-500/10 rounded">SOLD OUT</span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-end justify-between mt-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-yellow-400/70">FROM</p>
                                <p className={`font-bold text-[15px] ${item.available === false ? 'text-white/40' : 'text-yellow-300'}`}>{currencySymbol}{item.price}</p>
                              </div>
                              {item.available === false ? (
                                <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 bg-gradient-to-br from-yellow-500 to-yellow-400 text-purple-900"
                                  data-testid={`add-item-${item.id}`}
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (showCategorySidebar && hasGenericTheme) ? null : showCategoryHeader ? (
          /* Header Mode - Non-collapsible sections for generic themes with header category display */
          <div className="py-4 space-y-8">
            {availableCategories.map((category) => {
              const items = getItemsByCategory(category.id);
              if (items.length === 0) return null;

              return (
                <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                  {/* Category Header */}
                  <div 
                    className="px-5 py-4 rounded-t-2xl mb-0 shadow-sm"
                    style={{ background: genericTheme.colors.primary }}
                  >
                    <h3 className="font-bold text-lg" style={{ color: genericTheme.colors.headerText }}>{category.name}</h3>
                  </div>

                  {/* Items Grid */}
                  <div 
                    className="rounded-b-2xl border border-t-0 p-4"
                    style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className={`rounded-xl overflow-hidden transition-all duration-200 group flex border ${item.available === false ? 'opacity-60' : 'cursor-pointer hover:shadow-md'}`}
                          style={{ background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' }}
                          data-testid={`menu-item-${item.id}`}
                        >
                          {/* Product Image */}
                          <div className="relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg m-2 bg-gray-100">
                            <img 
                              src={item.image || getItemImage(category.id, index)}
                              alt={item.name}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                            />
                            {item.available === false && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 
                                className="font-semibold text-[15px] leading-tight"
                                style={{ color: item.available === false ? genericTheme.colors.textMuted : genericTheme.colors.text }}
                              >
                                {item.name}
                              </h3>
                              {item.description && (
                                <p 
                                  className="text-xs mt-1 line-clamp-2 leading-relaxed"
                                  style={{ color: genericTheme.colors.textMuted }}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-end justify-between mt-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide" style={{ color: genericTheme.colors.textMuted }}>FROM</p>
                                <p className="font-bold text-[15px]" style={{ color: genericTheme.colors.accent }}>{currencySymbol}{item.price}</p>
                              </div>
                              {item.available !== false && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                                  style={{ background: genericTheme.colors.primary, color: genericTheme.colors.headerText }}
                                  data-testid={`add-item-${item.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Default Collapsible Menu for other themes - Flipdish Style */
          <div>
            {availableCategories.map(category => {
            const items = getItemsByCategory(category.id);
            if (items.length === 0) return null;

            return (
              <Collapsible
                key={category.id}
                id={`category-${category.id}`}
                open={expandedCategories.includes(category.id)}
                onOpenChange={() => toggleCategory(category.id)}
                className={`mb-4 border-b scroll-mt-32 ${isSpicyTheme ? 'border-white/20' : hasGenericTheme ? '' : 'border-gray-200'}`}
                style={hasGenericTheme ? { borderColor: genericTheme?.colors.accent + '40' } : {}}
              >
                <CollapsibleTrigger 
                  className={`flex items-center justify-between w-full py-5 px-1 transition-colors ${isSpicyTheme ? 'hover:bg-white/10' : hasGenericTheme ? '' : 'hover:bg-gray-50'}`}
                  style={hasGenericTheme ? { color: genericTheme?.colors.text } : {}}
                >
                  <h2 className={`text-lg font-bold text-left ${isSpicyTheme ? 'text-white' : hasGenericTheme ? '' : 'text-gray-900'}`} style={hasGenericTheme ? { color: genericTheme?.colors.text } : {}}>{category.name}</h2>
                  <div style={hasGenericTheme ? { color: genericTheme?.colors.textMuted } : {}}>
                    {expandedCategories.includes(category.id) ? (
                      <ChevronUp className={`h-5 w-5 ${isSpicyTheme ? 'text-white/70' : hasGenericTheme ? '' : 'text-gray-400'}`} />
                    ) : (
                      <ChevronDown className={`h-5 w-5 ${isSpicyTheme ? 'text-white/70' : hasGenericTheme ? '' : 'text-gray-400'}`} />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`rounded-xl overflow-hidden transition-all duration-200 group flex border ${isSpicyTheme ? 'bg-slate-800/90 border-white/20 hover:border-white/40' : hasGenericTheme ? '' : 'bg-white'} ${item.available === false ? 'opacity-60' : 'cursor-pointer hover:shadow-md'} ${isSpicyTheme ? '' : hasGenericTheme ? '' : item.available === false ? 'border-gray-100' : 'border-gray-100 hover:border-gray-200'}`}
                        style={hasGenericTheme ? { background: genericTheme.colors.cardBg, borderColor: genericTheme.colors.accent + '40' } : {}}
                        data-testid={`menu-item-${item.id}`}
                      >
                        {/* Left - Product Image/Video/GIF - Flipdish Style */}
                        <div className={`relative w-[100px] h-[100px] flex-shrink-0 overflow-hidden rounded-lg m-2 ${isSpicyTheme ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          {item.videoUrl ? (
                            <video 
                              src={item.videoUrl}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : item.gifUrl ? (
                            <img 
                              src={item.gifUrl}
                              alt={item.name}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                            />
                          ) : (
                            <img 
                              src={item.image || getItemImage(category.id, index)}
                              alt={item.name}
                              className={`w-full h-full object-cover rounded-lg ${item.available === false ? 'grayscale' : ''}`}
                            />
                          )}
                          {item.available === false && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                              <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Right - Product Info - Flipdish Style */}
                        <div className="flex-1 py-3 pr-3 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className={`font-semibold text-[15px] leading-tight ${isSpicyTheme ? (item.available === false ? 'text-white/40' : 'text-white') : hasGenericTheme ? '' : item.available === false ? 'text-gray-400' : 'text-gray-900'}`} style={hasGenericTheme ? { color: item.available === false ? genericTheme.colors.textMuted : genericTheme.colors.text } : {}}>{item.name}</h3>
                            {item.description && (
                              <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isSpicyTheme ? 'text-white/60' : hasGenericTheme ? '' : 'text-gray-500'}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>{item.description}</p>
                            )}
                          </div>
                          {/* Variant Options or Single Price */}
                          {item.variants && item.variants.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {item.variants.map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between">
                                  <span className={`text-xs ${isSpicyTheme ? ((variant as any).available === false ? 'text-white/40 line-through' : 'text-white/80') : hasGenericTheme ? '' : (variant as any).available === false ? 'text-gray-400 line-through' : 'text-gray-600'}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>{variant.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-sm ${hasGenericTheme ? '' : (variant as any).available === false ? 'text-gray-400' : 'text-[#22c55e]'}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}}>{currencySymbol}{variant.price}</span>
                                    {item.available !== false && (variant as any).available !== false ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addVariantToCart(item, variant);
                                        }}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md ${hasGenericTheme ? '' : 'bg-[#22c55e] hover:bg-[#16a34a] text-white'}`}
                                        style={hasGenericTheme ? { background: genericTheme.colors.primary, color: genericTheme.colors.headerText } : {}}
                                        data-testid={`add-variant-${variant.id}`}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    ) : (variant as any).available === false ? (
                                      <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded">SOLD OUT</span>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-end justify-between mt-2">
                              <div>
                                <p className={`text-[10px] uppercase tracking-wide ${isSpicyTheme ? 'text-white/50' : hasGenericTheme ? '' : 'text-gray-400'}`} style={hasGenericTheme ? { color: genericTheme.colors.textMuted } : {}}>FROM</p>
                                <p className={`font-bold text-[15px] ${hasGenericTheme ? '' : item.available === false ? 'text-gray-400' : 'text-[#22c55e]'}`} style={hasGenericTheme ? { color: genericTheme.colors.accent } : {}}>{currencySymbol}{item.price}{item.available !== false && !hasGenericTheme && <span className="text-[#22c55e]"> &gt;</span>}</p>
                              </div>
                              {item.available === false ? (
                                <span className="text-red-500 text-xs font-bold">SOLD OUT</span>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                  }}
                                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md ${hasGenericTheme ? '' : 'bg-[#22c55e] hover:bg-[#16a34a] text-white'}`}
                                  style={hasGenericTheme ? { background: genericTheme.colors.primary, color: genericTheme.colors.headerText } : {}}
                                  data-testid={`add-item-${item.id}`}
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          </div>
        )}

        {/* Royal Footer */}
        {isRoyalTheme && (
          <div className="mt-6 -mx-4 px-4 py-8 pb-24 text-center" style={{ background: 'linear-gradient(180deg, #1a1040 0%, #2d1b69 30%, #3d2180 60%, #2d1b69 100%)' }}>
            {/* Crown Divider */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-400"></div>
              <div className="relative">
                <span className="text-4xl drop-shadow-lg">👑</span>
                <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl -z-10"></div>
              </div>
              <div className="h-[2px] w-16 bg-gradient-to-l from-transparent via-yellow-500 to-yellow-400"></div>
            </div>
            
            <p className="text-yellow-200/90 text-sm font-semibold tracking-wide mb-2">Thank You for Choosing</p>
            <p className="text-2xl font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
              {restaurant?.name || 'Shiraz Afghan'}
            </p>
            <p className="text-purple-200/70 text-xs mt-2 italic font-medium">Authentic Afghan Cuisine - A Royal Experience</p>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-1.5 mt-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-lg drop-shadow" style={{ color: i % 2 === 0 ? '#eab308' : '#fbbf24' }}>★</span>
              ))}
            </div>
            
            {/* Royal Seal */}
            <div className="mt-6 flex items-center justify-center">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 shadow-lg">
                <span className="text-purple-900 text-xs font-bold tracking-widest uppercase">Premium Afghan Cuisine</span>
              </div>
            </div>
            
          </div>
        )}
      </main>
      )}

      {/* Floating Cart Button - Flipdish Style */}
      {!isCartOpen && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <Button 
          onClick={() => setIsCartOpen(true)}
          className={`w-full h-14 rounded-full shadow-2xl flex justify-between items-center px-6 transition-all hover:scale-[1.02] ${isRoyalTheme ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-purple-900 font-bold' : 'bg-[#22c55e] hover:bg-[#16a34a] text-white'}`}
          data-testid="button-view-basket"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 h-9 w-9 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </div>
            <span className="font-bold text-lg">View Basket</span>
          </div>
          <span className="font-bold text-xl">{currencySymbol}{cartTotal.toFixed(2)}</span>
        </Button>
      </div>
      )}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent 
          className="w-full sm:max-w-md flex flex-col border-l-0"
          style={{
            background: isMaharajTheme 
              ? MAHARAJ_THEME.gradient.background
              : 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)',
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
              Your Basket
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/60 space-y-4">
                <ShoppingBasket className="h-16 w-16" />
                <p>Your basket is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => {
                  const itemTotalPrice = getItemTotalPrice(item);
                  const extrasTotal = item.extras.reduce((sum, extraName) => {
                    const topping = activeToppings.find(t => t.name === extraName);
                    return sum + (topping ? Number(topping.price) : 0);
                  }, 0);
                  return (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-xl border border-white/20"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Quantity Controls */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/30 text-green-400 hover:bg-green-500/50 transition-all"
                              data-testid={`increase-qty-${item.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <span className="text-white font-bold text-sm w-7 text-center">{item.quantity}</span>
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  setCart(prev => prev.filter(i => i.id !== item.id));
                                } else {
                                  setCart(prev => prev.map(i => i.id === item.id ? {...i, quantity: i.quantity - 1} : i));
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/50 transition-all"
                              data-testid={`decrease-qty-${item.id}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
                            )}
                            {item.extras.length > 0 && (
                              <p className="text-xs text-green-400 mt-0.5 font-medium">
                                EXTRA: {item.extras.join(', ')} (+{currencySymbol}{extrasTotal.toFixed(2)})
                              </p>
                            )}
                            {item.optionGroups && item.optionGroups.length > 0 && (
                              <div className="mt-0.5 space-y-0.5">
                                {item.optionGroups.map((group, gIdx) => (
                                  <p key={gIdx} className="text-xs text-orange-400 font-medium">
                                    {group.groupHeadline}: {group.selectedOptions.map((o: { id: string; name: string; price: number }) => o.name + (o.price > 0 ? ` (+${currencySymbol}${o.price.toFixed(2)})` : '')).join(', ')}
                                  </p>
                                ))}
                              </div>
                            )}
                            {item.removedIngredients.length > 0 && (
                              <p className="text-xs text-red-400 mt-0.5 font-medium">
                                NO: {item.removedIngredients.join(', ')}
                              </p>
                            )}
                            <p className="text-sm text-white/60 mt-1">{currencySymbol}{item.price.toFixed(2)}{extrasTotal > 0 ? ` + ${currencySymbol}${extrasTotal.toFixed(2)} extras` : ''} each</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="font-bold text-yellow-300 text-lg">{currencySymbol}{itemTotalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Special Instructions */}
          <div className="mt-4 px-1">
            <label className="text-white/70 text-sm mb-2 block">Special Instructions (optional)</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, allergies, extra spicy, no onions..."
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/50"
              rows={2}
              data-testid="input-special-instructions-default"
            />
          </div>
          
          <div className="border-t border-white/20 pt-4 space-y-4">
            <div className="flex justify-between text-xl font-bold">
              <span className="text-white">Total</span>
              <span className="text-yellow-300">{currencySymbol}{cartTotal.toFixed(2)}</span>
            </div>
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button 
                  className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] ${!isAcceptingOrders ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-400 hover:via-emerald-400 hover:to-green-400 text-white'}`} 
                  disabled={cart.length === 0 || !isAcceptingOrders}
                >
                  {!isAcceptingOrders ? 'Orders Currently Closed' : 'Go to Checkout'}
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="border-0 p-0 overflow-hidden max-h-[90vh]"
                style={{
                  background: isMaharajTheme 
                    ? MAHARAJ_THEME.gradient.background
                    : 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)',
                }}
              >
                <ScrollArea className="max-h-[80vh]">
                <div className="p-6 pb-10">
                  <DialogHeader className="flex flex-row items-center gap-2">
                    <CheckSquare className="h-6 w-6 text-white" />
                    <DialogTitle className="text-xl font-bold text-white">
                      Complete Your Order
                    </DialogTitle>
                  </DialogHeader>
                  
                  {/* Order Type Selector */}
                  <div className="mt-4 mb-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType("delivery")}
                      className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-sm font-medium ${
                        orderType === "delivery" 
                          ? "bg-orange-500/20 text-orange-400 border-orange-500" 
                          : "border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                      data-testid="button-order-type-delivery"
                    >
                      <Truck className="h-4 w-4" /> Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("takeaway")}
                      className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-sm font-medium ${
                        orderType === "takeaway" 
                          ? "bg-green-500/20 text-green-400 border-green-500" 
                          : "border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                      data-testid="button-order-type-collection"
                    >
                      <ShoppingBag className="h-4 w-4" /> Collection
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("dine-in")}
                      className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-sm font-medium ${
                        orderType === "dine-in" 
                          ? "bg-blue-500/20 text-blue-400 border-blue-500" 
                          : "border-gray-600 text-gray-400 hover:border-gray-500"
                      }`}
                      data-testid="button-order-type-dinein"
                    >
                      <UtensilsCrossed className="h-4 w-4" /> Dine-In
                    </button>
                  </div>
                  
                  {/* Estimated Delivery Time */}
                  {orderType === "delivery" && (
                    <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-green-400 font-semibold text-sm">Estimated Delivery Time</p>
                          <p className="text-green-300 text-lg font-bold">{restaurant?.deliveryTimeMinutes || 45} minutes</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === "card" && stripePromise && stripeActuallyLoaded ? (
                    <Elements stripe={stripePromise}>
                      <WalletPaymentButton
                        amount={calculateFinalTotal(cartTotal, orderType)}
                        restaurantId={restaurant.id}
                        currency={restaurant?.currency || 'GBP'}
                        label={restaurant?.name || 'Order Total'}
                        onPaymentSuccess={handleCardPaymentSuccess}
                        onPaymentError={handleCardPaymentError}
                        validateForm={validateCheckoutForm}
                        validateDeliveryAsync={validateDeliveryForCard}
                      />
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-gray-900 px-2 text-gray-500">or pay with card</span></div>
                      </div>
                      <CardPaymentForm
                        amount={calculateFinalTotal(cartTotal, orderType)}
                        restaurantId={restaurant.id}
                        onPaymentSuccess={handleCardPaymentSuccess}
                        onPaymentError={handleCardPaymentError}
                        isProcessing={isProcessingPayment}
                        setIsProcessing={setIsProcessingPayment}
                        themeStyle="dark"
                        validateForm={validateCheckoutForm}
                        validateDeliveryAsync={validateDeliveryForCard}
                      >
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerNameDefaultCard" className="text-gray-300">Your Name</Label>
                            <Input 
                              id="customerNameDefaultCard" 
                              placeholder="Enter your full name" 
                              required 
                              className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400" 
                              onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                              data-testid="input-customer-name-card"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customerPhoneDefaultCard" className="text-gray-300">Phone Number</Label>
                            <div className="flex gap-2">
                              <div className="w-16 h-11 flex items-center justify-center bg-gray-800/80 border border-gray-600 rounded-md text-gray-300 text-sm" data-testid="text-phone-prefix">
                                +44
                              </div>
                              <Input 
                                id="customerPhoneDefaultCard" 
                                type="tel" 
                                placeholder="7XXX XXX XXX" 
                                required 
                                className="flex-1 h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400" 
                                onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                                data-testid="input-customer-phone-card"
                              />
                            </div>
                          </div>
                          {orderType === "delivery" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="deliveryAddressDefaultCard" className="text-gray-300">Delivery Address</Label>
                                <Input 
                                  id="deliveryAddressDefaultCard" 
                                  placeholder="House number and street" 
                                  required 
                                  className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400" 
                                  onChange={(e) => checkoutFormDataRef.current.deliveryAddress = e.target.value}
                                  data-testid="input-delivery-address-card"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="postcodeDefaultCard" className="text-gray-300">Postcode</Label>
                                <Input 
                                  id="postcodeDefaultCard" 
                                  placeholder="E.G. WD18 0AB" 
                                  required 
                                  className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400 uppercase" 
                                  onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value.toUpperCase()}
                                  data-testid="input-postcode-card"
                                />
                              </div>
                              {deliveryAreaError && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm" data-testid="delivery-area-error">
                                  {deliveryAreaError}
                                </div>
                              )}
                            </>
                          )}
                          <div className="space-y-2">
                            <Label className="text-gray-300">Payment Method</Label>
                            <div className="grid grid-cols-2 gap-3">
                              {orderType !== "delivery" && (
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("cash")}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "cash" ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                                data-testid="button-payment-cash-default"
                              >
                                <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                              </button>
                              )}
                              {hasStripeKeys && (
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("card")}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "card" ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                                data-testid="button-payment-card-default"
                              >
                                <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                                <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                              </button>
                              )}
                              {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("bank_transfer")}
                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "bank_transfer" ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                                data-testid="button-payment-bank-default"
                              >
                                <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                                <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                              </button>
                              )}
                            </div>
                          </div>

                          {paymentMethod === "bank_transfer" && (
                            <BankTransferQRSection
                              restaurant={restaurant}
                              total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                              currencySymbol={currencySymbol}
                            />
                          )}
                          
                          {/* Order Summary */}
                          <div className="border-t border-gray-700 pt-4 mt-4">
                            <h4 className="font-bold text-white mb-3">Order Summary</h4>
                            <div className="space-y-2">
                              {cart.map((item: CartItem) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-gray-300">{item.quantity}x {item.name}</span>
                                  <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                                {restaurant?.cutleryOptionEnabled && (
                                  <div
                                    className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                    style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                    onClick={() => setAddCutlery(!addCutlery)}
                                    data-testid="button-add-cutlery"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                        {addCutlery && <span className="text-white text-xs">✓</span>}
                                      </div>
                                      <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                    </div>
                                    <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Subtotal</span>
                                  <span className="text-gray-300">{currencySymbol}{cartTotal.toFixed(2)}</span>
                                </div>
                                {addCutlery && restaurant?.cutleryOptionEnabled && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                    <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                                  </div>
                                )}
                                {orderType === "delivery" && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Delivery</span>
                                    <span className="text-gray-300">{currencySymbol}{Number(restaurant?.deliveryFee || 0).toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-1">
                                  <span className="text-white">Total</span>
                                  <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {paymentMethod === "card" && (
                            <div className="space-y-2">
                              <Label className="text-gray-300">Card Details</Label>
                            </div>
                          )}
                          
                          {cardError && (
                            <p className="text-red-400 text-sm">{cardError}</p>
                          )}

                          {paymentMethod === "bank_transfer" ? (
                            <Button 
                              type="button"
                              onClick={() => handleCheckout({ preventDefault: () => {}, currentTarget: { elements: { customerName: { value: checkoutFormDataRef.current.customerName }, customerPhone: { value: checkoutFormDataRef.current.customerPhone }, deliveryAddress: { value: checkoutFormDataRef.current.deliveryAddress } } } } as any)}
                              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-purple-600 hover:bg-purple-500 text-white transition-all" 
                              disabled={createOrderMutation.isPending}
                              data-testid="button-place-order-bank-default-card"
                            >
                              {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                              <Building className="mr-2 h-5 w-5" />
                              I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                            </Button>
                          ) : (
                          <Button 
                            type="submit" 
                            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 text-white transition-all" 
                            disabled={isProcessingPayment || createOrderMutation.isPending}
                            data-testid="button-place-order-default-card"
                          >
                            {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            <CreditCard className="mr-2 h-5 w-5" />
                            Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                          </Button>
                          )}
                        </div>
                      </CardPaymentForm>
                    </Elements>
                  ) : (
                    <form onSubmit={handleCheckout} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName" className="text-gray-300">Your Name</Label>
                        <Input 
                          id="customerName" 
                          name="customerName" 
                          placeholder="Enter your full name" 
                          required 
                          className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400"
                          defaultValue={checkoutFormDataRef.current.customerName}
                          onChange={(e) => checkoutFormDataRef.current.customerName = e.target.value}
                          data-testid="input-customer-name-cash"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone" className="text-gray-300">Phone Number</Label>
                        <div className="flex gap-2">
                          <div className="w-16 h-11 flex items-center justify-center bg-gray-800/80 border border-gray-600 rounded-md text-gray-300 text-sm" data-testid="text-phone-prefix-cash">
                            +44
                          </div>
                          <Input 
                            id="customerPhone" 
                            name="customerPhone" 
                            type="tel" 
                            placeholder="7XXX XXX XXX" 
                            required 
                            className="flex-1 h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400"
                            defaultValue={checkoutFormDataRef.current.customerPhone}
                            onChange={(e) => checkoutFormDataRef.current.customerPhone = e.target.value}
                            data-testid="input-customer-phone-cash"
                          />
                        </div>
                      </div>
                      {orderType === "delivery" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="deliveryAddress" className="text-gray-300">Delivery Address</Label>
                            <Input 
                              id="deliveryAddress" 
                              name="deliveryAddress" 
                              placeholder="House number and street" 
                              required 
                              className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400" 
                              defaultValue={checkoutFormDataRef.current.deliveryAddress}
                              onChange={(e) => checkoutFormDataRef.current.deliveryAddress = e.target.value}
                              data-testid="input-delivery-address-cash" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postcode" className="text-gray-300">Postcode</Label>
                            <Input 
                              id="postcode" 
                              name="postcode" 
                              placeholder="E.G. WD18 0AB" 
                              required 
                              className="h-11 bg-gray-800/80 border-gray-600 text-white placeholder:text-gray-400 uppercase"
                              defaultValue={checkoutFormDataRef.current.customerPostcode}
                              onChange={(e) => checkoutFormDataRef.current.customerPostcode = e.target.value.toUpperCase()}
                              data-testid="input-postcode-cash"
                            />
                          </div>
                          {deliveryAreaError && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm" data-testid="delivery-area-error-cash">
                              {deliveryAreaError}
                            </div>
                          )}
                        </>
                      )}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Payment Method</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {orderType !== "delivery" && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "cash" ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                            data-testid="button-payment-cash"
                          >
                            <Banknote className={`h-5 w-5 ${paymentMethod === "cash" ? 'text-blue-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "cash" ? 'text-white' : 'text-gray-400'}`}>Cash</span>
                          </button>
                          )}
                          {hasStripeKeys && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("card")}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "card" ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                            data-testid="button-payment-card"
                          >
                            <CreditCard className={`h-5 w-5 ${paymentMethod === "card" ? 'text-blue-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "card" ? 'text-white' : 'text-gray-400'}`}>Card</span>
                          </button>
                          )}
                          {((restaurant as any)?.bankTransferEnabled && (restaurant?.bankAccountName || restaurant?.easypaisaAccountNumber || restaurant?.jazzcashAccountNumber)) && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("bank_transfer")}
                            className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${paymentMethod === "bank_transfer" ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800/50'}`}
                            data-testid="button-payment-bank-cash"
                          >
                            <Building className={`h-5 w-5 ${paymentMethod === "bank_transfer" ? 'text-purple-400' : 'text-gray-400'}`} />
                            <span className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? 'text-white' : 'text-gray-400'}`}>Bank</span>
                          </button>
                          )}
                        </div>
                      </div>

                      {paymentMethod === "bank_transfer" && (
                        <BankTransferQRSection
                          restaurant={restaurant}
                          total={calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                          currencySymbol={currencySymbol}
                        />
                      )}
                      
                      {/* Order Summary */}
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-bold text-white mb-3">Order Summary</h4>
                        <div className="space-y-2">
                          {cart.map((item: CartItem) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-300">{item.quantity}x {item.name}</span>
                              <span className="text-white">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
                            {restaurant?.cutleryOptionEnabled && (
                              <div
                                className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all mb-2"
                                style={{ background: addCutlery ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)', border: addCutlery ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255,255,255,0.1)' }}
                                onClick={() => setAddCutlery(!addCutlery)}
                                data-testid="button-add-cutlery"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addCutlery ? 'bg-amber-500 border-amber-500' : 'border-white/40'}`}>
                                    {addCutlery && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <span className="text-white text-sm">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                </div>
                                <span className="text-amber-400 font-semibold text-sm">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span className="text-gray-300">{currencySymbol}{cartTotal.toFixed(2)}</span>
                            </div>
                            {addCutlery && restaurant?.cutleryOptionEnabled && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-400">{(restaurant as any).cutleryName || "Cutlery Set"}</span>
                                <span className="text-amber-400">+{currencySymbol}{Number((restaurant as any).cutleryPrice || 0.50).toFixed(2)}</span>
                              </div>
                            )}
                            {orderType === "delivery" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Delivery</span>
                                <span className="text-gray-300">{currencySymbol}{Number(restaurant?.deliveryFee || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-white">{currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded && (
                        <div className="border-t border-gray-700 pt-4">
                          <FallbackCardForm
                            amount={calculateFinalTotal(cartTotal, orderType)}
                            restaurantId={restaurant.id}
                            onPaymentSuccess={handleCardPaymentSuccess}
                            onPaymentError={handleCardPaymentError}
                            isProcessing={isProcessingPayment}
                            setIsProcessing={setIsProcessingPayment}
                            themeStyle="dark"
                            validateForm={validateCheckoutForm}
                            validateDeliveryAsync={validateDeliveryForCard}
                          />
                        </div>
                      )}

                      {paymentMethod === "card" && stripeLoadFinished && !stripeActuallyLoaded ? (
                        <Button 
                          type="button"
                          onClick={() => {
                            const form = document.getElementById('card-payment-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                          }}
                          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 text-white transition-all" 
                          disabled={isProcessingPayment || createOrderMutation.isPending}
                          data-testid="button-pay-now-default-fallback"
                        >
                          {(isProcessingPayment || createOrderMutation.isPending) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <CreditCard className="mr-2 h-5 w-5" />
                          Pay Now - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : paymentMethod === "bank_transfer" ? (
                        <Button 
                          type="submit"
                          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-purple-600 hover:bg-purple-500 text-white transition-all" 
                          disabled={createOrderMutation.isPending}
                          data-testid="button-place-order-bank-default"
                        >
                          {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                          <Building className="mr-2 h-5 w-5" />
                          I've Sent Payment - Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                        </Button>
                      ) : (
                      <Button 
                        type="submit" 
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-500 text-white transition-all" 
                        disabled={createOrderMutation.isPending}
                        data-testid="button-place-order-default"
                      >
                        {createOrderMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Place Order - {currencySymbol}{calculateFinalTotal(cartTotal, orderType).toFixed(2)}
                      </Button>
                      )}
                    </form>
                  )}
                </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>

      {/* Royal/Default Extras Dialog */}
      <Dialog open={showRoyalExtras} onOpenChange={(open) => { setShowRoyalExtras(open); if (!open) setTempSelectedExtras([]); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0" style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #5b21b6 100%)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
            <DialogHeader>
              <DialogTitle className="text-xl bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">Add Extras to Your Order?</DialogTitle>
            </DialogHeader>
            <p className="text-sm mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Select any extras you'd like to add</p>
          </div>
          
          <ScrollArea className="max-h-[50vh] p-4">
            <div className="grid grid-cols-2 gap-3">
              {activeToppings.map((topping: ExtraTopping) => (
                <button
                  key={topping.id}
                  onClick={() => {
                    setTempSelectedExtras(prev => 
                      prev.includes(topping.name) 
                        ? prev.filter(n => n !== topping.name)
                        : [...prev, topping.name]
                    );
                  }}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    tempSelectedExtras.includes(topping.name)
                      ? 'border-yellow-400 bg-yellow-400/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <p className="font-medium text-sm" style={{ color: '#ffffff' }}>{topping.name}</p>
                  <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>+{currencySymbol}{Number(topping.price).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </ScrollArea>

          {tempSelectedExtras.length > 0 && (
            <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(234, 179, 8, 0.3)', background: 'rgba(234, 179, 8, 0.1)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{tempSelectedExtras.length} extra(s) selected</span>
                <span className="font-bold" style={{ color: '#fbbf24' }}>
                  +{currencySymbol}{tempSelectedExtras.reduce((sum, name) => {
                    const t = activeToppings.find((tp: ExtraTopping) => tp.name === name);
                    return sum + (t ? Number(t.price) : 0);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 border-t flex gap-3" style={{ borderColor: 'rgba(234, 179, 8, 0.3)' }}>
            <Button
              variant="outline"
              onClick={() => {
                setTempSelectedExtras([]);
                setShowRoyalExtras(false);
                setIsCartOpen(true);
              }}
              className="flex-1"
              style={{ borderColor: 'rgba(234, 179, 8, 0.5)', color: '#fbbf24', background: 'transparent' }}
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                setShowRoyalExtras(false);
                setIsCartOpen(true);
              }}
              className="flex-1 font-bold"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#ffffff' }}
            >
              {tempSelectedExtras.length > 0 ? 'Continue with Extras' : 'View Basket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Cart Item Dialog */}
      <Dialog open={!!editingCartItem} onOpenChange={(open) => !open && setEditingCartItem(null)}>
        <DialogContent 
          className="border-0 p-0 overflow-hidden max-w-sm"
          style={{
            background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)',
          }}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                Edit Item
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {editingCartItem?.name}
              </DialogDescription>
            </DialogHeader>
            
            {editingCartItem?.description && (
              <div className="mt-4 space-y-3">
                <p className="text-white/80 text-sm font-medium">Remove ingredients:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editingCartItem.description.split(',').map((ingredient, idx) => {
                    const trimmedIngredient = ingredient.trim();
                    if (!trimmedIngredient) return null;
                    const isRemoved = tempRemovedIngredients.includes(trimmedIngredient);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isRemoved) {
                            setTempRemovedIngredients(prev => prev.filter(i => i !== trimmedIngredient));
                          } else {
                            setTempRemovedIngredients(prev => [...prev, trimmedIngredient]);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          isRemoved 
                            ? 'bg-red-500/30 border border-red-500/50' 
                            : 'bg-white/10 border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        <span className={`text-sm ${isRemoved ? 'text-red-300 line-through' : 'text-white'}`}>
                          {trimmedIngredient}
                        </span>
                        {isRemoved ? (
                          <X className="h-4 w-4 text-red-400" />
                        ) : (
                          <Check className="h-4 w-4 text-green-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingCartItem(null)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingCartItem) {
                    setCart(prev => prev.map(item => 
                      item.id === editingCartItem.id 
                        ? { ...item, removedIngredients: tempRemovedIngredients }
                        : item
                    ));
                    setEditingCartItem(null);
                    toast({
                      title: "Item Updated",
                      description: tempRemovedIngredients.length > 0 
                        ? `Removed: ${tempRemovedIngredients.join(', ')}`
                        : "No changes made",
                      duration: 2000,
                    });
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Extras Dialog */}
      <Dialog open={!!addingExtrasToItem} onOpenChange={(open) => !open && setAddingExtrasToItem(null)}>
        <DialogContent 
          className="border-0 p-0 overflow-hidden max-w-sm"
          style={{
            background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)',
          }}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-green-300 bg-clip-text text-transparent">
                Add Extras
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {addingExtrasToItem?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-3">
              <p className="text-white/80 text-sm font-medium">Select extra toppings:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeToppings.length > 0 ? activeToppings.map((topping) => {
                  const isSelected = tempSelectedExtras.includes(topping.name);
                  const isSoldOut = topping.isActive === false;
                  return (
                    <button
                      key={topping.id}
                      disabled={isSoldOut}
                      onClick={() => {
                        if (isSoldOut) return;
                        if (isSelected) {
                          setTempSelectedExtras(prev => prev.filter(t => t !== topping.name));
                        } else {
                          setTempSelectedExtras(prev => [...prev, topping.name]);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        isSoldOut
                          ? 'bg-red-500/10 border border-red-500/30 cursor-not-allowed opacity-60'
                          : isSelected 
                            ? 'bg-green-500/30 border border-green-500/50' 
                            : 'bg-white/10 border border-white/20 hover:bg-white/20'
                      }`}
                      data-testid={`extra-topping-${topping.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className={`text-sm flex items-center gap-2 ${isSoldOut ? 'line-through text-white/50' : isSelected ? 'text-green-300 font-medium' : 'text-white'}`}>
                        {topping.name}
                        {isSoldOut && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full no-underline">SOLD OUT</span>}
                      </span>
                      {isSoldOut ? (
                        <span className="text-red-400 text-xs">Unavailable</span>
                      ) : (
                        <span className={`text-sm ${isSelected ? 'text-green-300' : 'text-white/60'}`}>
                          {currencySymbol}{Number(topping.price).toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                }) : (
                  <p className="text-white/50 text-sm text-center py-4">No extra toppings available</p>
                )}
              </div>
              {tempSelectedExtras.length > 0 && (
                <div className="pt-2 border-t border-white/20">
                  <p className="text-sm text-green-400 font-medium">
                    Total extras: +{currencySymbol}{tempSelectedExtras.reduce((total, name) => {
                      const topping = activeToppings.find(t => t.name === name);
                      return total + (topping ? Number(topping.price) : 0);
                    }, 0).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAddingExtrasToItem(null)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (addingExtrasToItem) {
                    setCart(prev => prev.map(item => 
                      item.id === addingExtrasToItem.id 
                        ? { ...item, extras: tempSelectedExtras }
                        : item
                    ));
                    setAddingExtrasToItem(null);
                    const extrasTotal = tempSelectedExtras.reduce((sum, name) => {
                      const topping = activeToppings.find(t => t.name === name);
                      return sum + (topping ? Number(topping.price) : 0);
                    }, 0);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
              >
                Save Extras
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Universal Terms Footer - For themes without dedicated footers (Dixy, Tawa, Spicy, and any new themes) */}
      {!isDhabaTheme && !isEmparoTheme && !isBurgerTheme && !isTawaWatfordTheme && (
        <div className="pb-24 pt-8 px-4 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className={`text-sm mb-1 ${isRoyalTheme ? 'text-purple-300/70' : isDixyTheme ? 'text-white/50' : isTawaTheme ? 'text-gray-500' : isSpicyTheme ? 'text-white/50' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} {restaurant?.name}. All rights reserved.
          </p>
          <a 
            href="/terms" 
            className={`text-xs transition-colors ${isRoyalTheme ? 'text-purple-300/60 hover:text-yellow-400' : isDixyTheme ? 'text-white/40 hover:text-white' : isTawaTheme ? 'text-gray-400 hover:text-orange-500' : isSpicyTheme ? 'text-white/40 hover:text-green-400' : 'text-gray-400 hover:text-gray-600'}`}
            data-testid="link-terms-universal"
          >
            Terms & Conditions
          </a>
        </div>
      )}

      {/* Back to Top Button - moved to right side on mobile */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-28 right-4 md:left-6 md:right-auto z-50 shadow-lg rounded-full p-3 hover:shadow-xl transition-all hover:scale-110 ${
            isRoyalTheme 
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 border border-yellow-300 hover:from-yellow-400 hover:to-yellow-300' 
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          data-testid="button-back-to-top"
        >
          <ArrowUp className={`h-6 w-6 ${isRoyalTheme ? 'text-purple-900' : 'text-gray-700'}`} />
        </button>
      )}
      </>
      )}

      {/* Login Popup - Extracted to separate component for performance */}
      <LoginPopup 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        restaurantId={restaurant?.id} 
        initialCustomer={currentCustomer} 
        onCustomerUpdate={setCurrentCustomer} 
      />

      {/* Booking Popup */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowBooking(false)} data-testid="overlay-booking" />
          <div 
            className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl pb-24"
            style={{
              background: isDhabaTheme 
                ? DHABA_THEME.gradient.hero 
                : isEmparoTheme 
                  ? `linear-gradient(135deg, ${EMPARO_THEME.primary} 0%, ${EMPARO_THEME.secondary} 100%)`
                  : 'linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)'
            }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <button
                onClick={() => setShowBooking(false)}
                className="mb-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="close-booking"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <h2 className="text-3xl font-bold text-white">Book a table</h2>
              <p className="text-white/70 mt-1">Reserve your dining experience</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Address */}
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/10 border border-white/20">
                <MapPin className="h-5 w-5 text-white/70" />
                <span className="text-white">{restaurant?.address || "Address not set"}</span>
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Date</label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    data-testid="input-booking-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full h-12 px-3 border rounded-md bg-white/10 border-white/30 text-white"
                    data-testid="select-booking-time"
                  >
                    <option value="" className="bg-slate-800">Select time</option>
                    <option value="12:00" className="bg-slate-800">12:00 PM</option>
                    <option value="12:30" className="bg-slate-800">12:30 PM</option>
                    <option value="13:00" className="bg-slate-800">1:00 PM</option>
                    <option value="13:30" className="bg-slate-800">1:30 PM</option>
                    <option value="14:00" className="bg-slate-800">2:00 PM</option>
                    <option value="17:00" className="bg-slate-800">5:00 PM</option>
                    <option value="17:30" className="bg-slate-800">5:30 PM</option>
                    <option value="18:00" className="bg-slate-800">6:00 PM</option>
                    <option value="18:30" className="bg-slate-800">6:30 PM</option>
                    <option value="19:00" className="bg-slate-800">7:00 PM</option>
                    <option value="19:30" className="bg-slate-800">7:30 PM</option>
                    <option value="20:00" className="bg-slate-800">8:00 PM</option>
                    <option value="20:30" className="bg-slate-800">8:30 PM</option>
                    <option value="21:00" className="bg-slate-800">9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Guest Counters */}
              <div className="space-y-4 pt-4">
                {/* Adults */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-medium text-white">Adults</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAdults(Math.max(0, adults - 1))}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-adults-decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-lg text-white font-bold" data-testid="text-adults-count">{adults}</span>
                    <button
                      onClick={() => setAdults(adults + 1)}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-adults-increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="font-medium text-white">Children</span>
                    <p className="text-sm text-white/60">Ages 2-12</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-children-decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-lg text-white font-bold" data-testid="text-children-count">{children}</span>
                    <button
                      onClick={() => setChildren(children + 1)}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-children-increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="font-medium text-white">Infants</span>
                    <p className="text-sm text-white/60">Ages 0-2</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-infants-decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-lg text-white font-bold" data-testid="text-infants-count">{infants}</span>
                    <button
                      onClick={() => setInfants(infants + 1)}
                      className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                      data-testid="button-infants-increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-4 pt-6 border-t border-white/20">
                <h3 className="font-semibold text-white text-lg">Your Details</h3>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Name *</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    data-testid="input-booking-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone *</label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    data-testid="input-booking-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email (optional)"
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                    data-testid="input-booking-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <span className="flex items-center gap-2">
                      ♿ Special Assistance / Accessibility Needs
                    </span>
                  </label>
                  <textarea
                    placeholder="e.g., Wheelchair access, high chair needed, dietary requirements, etc."
                    value={specialHelp}
                    onChange={(e) => setSpecialHelp(e.target.value)}
                    className="w-full h-24 p-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder:text-white/50 resize-none"
                    data-testid="input-special-help"
                  />
                </div>
              </div>
              
              {/* Spacer for fixed button */}
              <div className="h-24"></div>
            </div>

            {/* Place Booking Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 max-w-md ml-auto">
              <Button
                className={`w-full h-14 rounded-xl text-lg font-semibold shadow-lg ${
                  adults + children > 0 && bookingName && bookingPhone && bookingDate && bookingTime
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-white/20 text-white/50"
                }`}
                disabled={adults + children === 0 || !bookingName || !bookingPhone || !bookingDate || !bookingTime || isSubmittingBooking}
                onClick={async () => {
                  if (!restaurant) return;
                  setIsSubmittingBooking(true);
                  try {
                    const res = await fetch("/api/bookings", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        restaurantId: restaurant.id,
                        customerName: bookingName,
                        email: bookingEmail || "no-email@guest.com",
                        phone: bookingPhone,
                        date: bookingDate,
                        time: bookingTime,
                        guests: adults + children + infants,
                        adults: adults,
                        children: children,
                        infants: infants,
                        specialHelp: specialHelp || null,
                      }),
                    });
                    if (res.ok) {
                      toast({ title: "Booking Confirmed!", description: `Table for ${adults + children + infants} on ${bookingDate} at ${bookingTime}` });
                      setShowBooking(false);
                      setBookingName("");
                      setBookingPhone("");
                      setBookingEmail("");
                      setBookingDate("");
                      setBookingTime("");
                      setAdults(0);
                      setChildren(0);
                      setInfants(0);
                      setSpecialHelp("");
                    } else {
                      toast({ title: "Booking Failed", description: "Please try again", variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to place booking", variant: "destructive" });
                  }
                  setIsSubmittingBooking(false);
                }}
                data-testid="place-booking"
              >
                {isSubmittingBooking ? "Booking..." : "Place Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Allergen Matrix Popup - Rendered for ALL themes */}
      {showAllergenMatrix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAllergenMatrix(false)} data-testid="overlay-allergen" />
          <div 
            className="relative rounded-2xl shadow-2xl max-w-5xl w-[95%] max-h-[90vh] overflow-hidden border border-white/10"
            style={{
              background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #5b21b6 100%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                  {restaurant?.name} – Allergen Information
                </h2>
                <p className="text-white/60 text-sm mt-1">Full allergen matrix for all menu items</p>
              </div>
              <button 
                onClick={() => setShowAllergenMatrix(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="close-allergen-matrix"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Legend and Search */}
            <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/20">
                <div className="w-7 h-7 rounded-md border border-gray-600 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-white text-sm font-medium">Contains Allergen</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/20">
                <div className="w-7 h-7 rounded-md border border-gray-600 flex items-center justify-center">
                </div>
                <span className="text-white text-sm font-medium">No Allergen</span>
              </div>
              <div className="flex-1 min-w-[200px] max-w-[350px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={allergenSearchQuery}
                    onChange={(e) => setAllergenSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                    data-testid="input-allergen-search"
                  />
                  {allergenSearchQuery && (
                    <button
                      onClick={() => setAllergenSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-auto max-h-[55vh] relative">
              <table className="text-sm border-collapse" style={{ minWidth: '100%' }}>
                <thead className="sticky top-0 z-20">
                  <tr style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}>
                    <th className="text-left p-4 font-semibold text-white w-[220px] min-w-[220px] sticky left-0 z-30" style={{ background: '#1e1b4b' }}>Product</th>
                    {ALLERGEN_KEYS.map(allergen => (
                      <th key={allergen} className="p-2 text-center font-bold text-white whitespace-nowrap w-[65px] min-w-[65px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-2xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }}>
                            {allergen === "gluten" ? "🌾" :
                             allergen === "crustaceans" ? "🦐" :
                             allergen === "eggs" ? "🥚" :
                             allergen === "fish" ? "🐟" :
                             allergen === "peanuts" ? "🥜" :
                             allergen === "soybeans" ? "🫘" :
                             allergen === "milk" ? "🥛" :
                             allergen === "nuts" ? "🌰" :
                             allergen === "celery" ? "🥬" :
                             allergen === "mustard" ? "🟡" :
                             allergen === "sesame" ? "⚪" :
                             allergen === "sulphites" ? "🧪" :
                             allergen === "lupin" ? "🌸" :
                             allergen === "molluscs" ? "🦪" : "❓"}
                          </span>
                          <span className="capitalize text-[9px] font-bold text-yellow-200">{allergen}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availableCategories.map(category => {
                    const categoryItems = menuItemsWithVariants.filter(item => {
                      const matchesCategory = item.category.toLowerCase() === category.id.toLowerCase();
                      const matchesSearch = !allergenSearchQuery || item.name.toLowerCase().includes(allergenSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });
                    if (categoryItems.length === 0) return null;
                    
                    return (
                      <React.Fragment key={category.id}>
                        {/* Category Header Row */}
                        <tr className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30">
                          <td colSpan={ALLERGEN_KEYS.length + 1} className="p-3 font-bold text-yellow-300 text-base">
                            📦 {category.name}
                          </td>
                        </tr>
                        {/* Items */}
                        {categoryItems.map((item, idx) => (
                          <tr key={item.id} className={`border-b border-white/10 hover:bg-white/10 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}`}>
                            <td className="p-3 font-medium sticky left-0 z-10 text-white text-sm" style={{ background: idx % 2 === 0 ? '#2d2875' : '#352f85', minWidth: '220px' }}>{item.name}</td>
                            {ALLERGEN_KEYS.map(allergen => {
                              const profile = (item as any).allergenProfile as AllergenProfile | undefined;
                              const status = profile?.[allergen] || "unknown";
                              const isChecked = status === "contains";
                              return (
                                <td key={allergen} className="p-1 text-center">
                                  <div className={`w-7 h-7 rounded mx-auto flex items-center justify-center border ${isChecked ? 'border-green-500 bg-green-500/20' : 'border-gray-500/50'}`}>
                                    {isChecked && <Check className="h-4 w-4 text-green-400" />}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Note */}
            <div className="p-4 border-t border-white/10 text-sm text-white/70">
              <p><strong className="text-yellow-300">Important:</strong> If you have any food allergies, please inform our staff when ordering. Our kitchen handles multiple allergens and cross-contamination may occur.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Tracking Card - Enhanced with Driver Location */}
      {showOrderTracking && activeOrder && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <div className="bg-white/20 rounded-full p-1.5">
                  {trackingData?.delivery?.status === "delivering" ? (
                    <Truck className="h-4 w-4 animate-pulse" />
                  ) : trackingData?.delivery?.status === "picked_up" ? (
                    <Truck className="h-4 w-4" />
                  ) : activeOrder.status === "ready" ? (
                    <Check className="h-4 w-4" />
                  ) : activeOrder.status === "preparing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : activeOrder.status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>
                <span className="font-bold text-sm">Order #{activeOrder.orderNumber}</span>
              </div>
              <button 
                onClick={() => setShowOrderTracking(false)}
                className="text-white/80 hover:text-white"
                data-testid="button-close-tracking"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Enhanced Status with Delivery Info */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  trackingData?.delivery?.status === "delivering" ? "bg-blue-500 animate-pulse" :
                  trackingData?.delivery?.status === "picked_up" ? "bg-purple-500" :
                  activeOrder.status === "completed" ? "bg-green-500" :
                  activeOrder.status === "ready" ? "bg-blue-500" :
                  activeOrder.status === "preparing" ? "bg-yellow-500 animate-pulse" :
                  "bg-gray-400"
                }`} />
                <span className="font-medium text-gray-800">
                  {trackingData?.delivery?.status === "delivering" && "🚗 Your order is on the way!"}
                  {trackingData?.delivery?.status === "picked_up" && "✅ Order ready in kitchen - Delivery soon!"}
                  {trackingData?.delivery?.status === "accepted" && "🚗 Driver assigned - Preparing your order"}
                  {!trackingData?.delivery && activeOrder.status === "new" && "Order received - Waiting for confirmation"}
                  {!trackingData?.delivery && activeOrder.status === "preparing" && "Being prepared in the kitchen"}
                  {!trackingData?.delivery && activeOrder.status === "ready" && (activeOrder.type === "delivery" ? "Ready for delivery" : "Ready for collection")}
                  {activeOrder.status === "completed" && "✅ Order completed - Enjoy your meal!"}
                </span>
              </div>
              
              {/* Driver Info Card - Show when driver is assigned */}
              {trackingData?.driver && ['accepted', 'picked_up', 'delivering'].includes(trackingData?.delivery?.status || '') && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">{trackingData.driver.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{trackingData.driver.name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        {trackingData.driver.vehicleType === 'car' && '🚗'}
                        {trackingData.driver.vehicleType === 'bike' && '🏍️'}
                        {trackingData.driver.vehicleType === 'bicycle' && '🚴'}
                        {trackingData.driver.vehicleType || 'Vehicle'} • Your Driver
                      </p>
                    </div>
                    {trackingData.driverLocation && (
                      <button
                        onClick={() => setShowDriverMap(!showDriverMap)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                        data-testid="button-track-driver"
                      >
                        <MapPin className="h-4 w-4" />
                        {showDriverMap ? 'Hide Map' : 'Track'}
                      </button>
                    )}
                  </div>
                  
                  {/* Live Driver Map */}
                  {showDriverMap && trackingData.driverLocation && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-blue-200">
                      <iframe
                        title="Driver Location"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.google.com/maps/embed/v1/place?key=REPLACE_WITH_VITE_GOOGLE_MAPS_API_KEY&q=${trackingData.driverLocation.lat},${trackingData.driverLocation.lng}&zoom=15`}
                      ></iframe>
                      <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                        📍 {trackingData.driver.name} is on the way!
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Delivery Time */}
              {activeOrder.type === "delivery" && !trackingData?.driver && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                  <Truck className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Estimated Delivery</p>
                    <p className="text-lg font-bold text-blue-800">
                      Today - {activeOrder.estimatedDeliveryMinutes || (restaurant as any)?.deliveryTimeMinutes || 45} mins
                    </p>
                  </div>
                </div>
              )}
              
              {/* Collection Time */}
              {(activeOrder.type === "takeaway" || activeOrder.type === "collection") && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
                  <ShoppingBag className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-xs text-orange-600 font-medium">Ready for Collection</p>
                    <p className="text-lg font-bold text-orange-800">
                      {activeOrder.status === "ready" ? "Now!" : `~${activeOrder.estimatedDeliveryMinutes || 20} mins`}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Delivery Status Timeline */}
              {activeOrder.type === "delivery" && trackingData?.delivery && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium mb-2">Delivery Progress</p>
                  <div className="flex items-center gap-1">
                    <div className={`flex-1 h-1.5 rounded-full ${trackingData.delivery.status !== 'unassigned' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1.5 rounded-full ${['accepted', 'picked_up', 'delivering', 'completed'].includes(trackingData.delivery.status) ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1.5 rounded-full ${['picked_up', 'delivering', 'completed'].includes(trackingData.delivery.status) ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1.5 rounded-full ${['delivering', 'completed'].includes(trackingData.delivery.status) ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`flex-1 h-1.5 rounded-full ${trackingData.delivery.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Placed</span>
                    <span>Accepted</span>
                    <span>Ready</span>
                    <span>On Way</span>
                    <span>Delivered</span>
                  </div>
                </div>
              )}
              
              {/* Custom Status Message */}
              {activeOrder.statusMessage && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Message from restaurant:</strong> {activeOrder.statusMessage}
                  </p>
                </div>
              )}
              
              {/* Order Total */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-600 text-sm">Order Total</span>
                <span className="font-bold text-lg">{currencySymbol}{Number(activeOrder.total).toFixed(2)}</span>
              </div>
              
              {/* WhatsApp Order Confirmation */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🍽️ *Order Confirmation*\n\n` +
                    `📍 *${restaurant?.name || 'Restaurant'}*\n` +
                    `🧾 Order #${activeOrder.orderNumber || activeOrder.id}\n\n` +
                    `📦 Type: ${activeOrder.type === 'delivery' ? 'Delivery' : 'Collection'}\n` +
                    `💰 Total: ${currencySymbol}${Number(activeOrder.total).toFixed(2)}\n` +
                    `📱 Status: ${activeOrder.status === 'new' ? 'Received' : activeOrder.status === 'preparing' ? 'Being Prepared' : activeOrder.status === 'ready' ? 'Ready!' : activeOrder.status}\n\n` +
                    (activeOrder.type === 'delivery' && activeOrder.address ? `📍 Delivery to: ${activeOrder.address}\n\n` : '') +
                    `Thank you for your order! 🙏`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                  data-testid="button-share-whatsapp"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Option Group Selection Dialog - Colorful Purple Gradient Style */}
      {/* Available for all themes that don't have their own topping dialog */}
      <Dialog open={!!itemWithOptionsDialog} onOpenChange={(open) => { if (!open) { setItemWithOptionsDialog(null); setPendingVariant(null); } }}>
          <DialogContent 
            className="max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)',
            }}
          >
            <div className="p-5">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold text-white">
                  Customize Your Order
                </DialogTitle>
                <DialogDescription className="text-purple-200/80 text-sm">
                  {pendingVariant ? pendingVariant.variantName : itemWithOptionsDialog?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}>
                {itemWithOptionsDialog && (
                  <OptionGroupSelector
                    groups={getGroupsForItem(itemWithOptionsDialog.id)}
                    selections={tempOptionGroupSelections}
                    quantities={tempOptionGroupQuantities}
                    onSelectionChange={(groupId, optionIds) => {
                      setTempOptionGroupSelections(prev => ({ ...prev, [groupId]: optionIds }));
                    }}
                    onQuantityChange={(groupId, optionId, quantity) => {
                      setTempOptionGroupQuantities(prev => ({
                        ...prev,
                        [groupId]: { ...prev[groupId], [optionId]: quantity }
                      }));
                    }}
                    currencySymbol={currencySymbol}
                    themeColors={{
                      primary: "#22c55e",
                      secondary: "#16a34a",
                      selectedBg: "rgba(34,197,94,0.2)",
                      text: "#ffffff",
                    }}
                  />
                )}
              </div>
              
              {/* Price Total Section */}
              <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total</span>
                  <span className="text-2xl font-bold text-green-400">
                    {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setItemWithOptionsDialog(null)}
                  className="flex-1 rounded-full py-5 font-semibold border-purple-300/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => itemWithOptionsDialog && addToCartWithOptions(itemWithOptionsDialog)}
                  className="flex-1 rounded-full py-5 font-semibold shadow-lg hover:shadow-xl transition-all text-white"
                  style={{ 
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  }}
                  data-testid="button-add-with-options-global"
                >
                  Add to Basket - {currencySymbol}{((pendingVariant ? pendingVariant.variantPrice : Number(itemWithOptionsDialog?.price || 0)) + (itemWithOptionsDialog ? getOptionGroupsPrice(itemWithOptionsDialog.id) : 0)).toFixed(2)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Install Prompt for PWA Add to Home Screen */}
      <InstallPrompt restaurantName={restaurant?.name} logoUrl={restaurant?.logoUrl || undefined} />
    </div>
  );
}

