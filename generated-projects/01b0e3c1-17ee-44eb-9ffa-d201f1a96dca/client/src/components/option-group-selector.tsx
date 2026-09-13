import React from "react";
import { Check, Plus, Minus } from "lucide-react";
import type { ToppingGroupWithOptions } from "@shared/schema";

interface OptionGroupSelection {
  groupId: string;
  groupHeadline: string;
  isRequired: boolean;
  selectedOptions: { id: string; name: string; price: number; quantity?: number }[];
}

interface OptionGroupSelectorProps {
  groups: ToppingGroupWithOptions[];
  selections: Record<string, string[]>;
  quantities?: Record<string, Record<string, number>>;
  onSelectionChange: (groupId: string, optionIds: string[]) => void;
  onQuantityChange?: (groupId: string, optionId: string, quantity: number) => void;
  currencySymbol: string;
  themeColors?: {
    primary: string;
    secondary: string;
    selectedBg: string;
    text: string;
  };
}

export function OptionGroupSelector({
  groups,
  selections,
  quantities = {},
  onSelectionChange,
  onQuantityChange,
  currencySymbol,
  themeColors = {
    primary: "#10b981",
    secondary: "#059669",
    selectedBg: "rgba(16, 185, 129, 0.2)",
    text: "#ffffff",
  },
}: OptionGroupSelectorProps) {
  if (!groups || groups.length === 0) return null;

  const handleOptionClick = (group: ToppingGroupWithOptions, optionId: string) => {
    const currentSelections = selections[group.id] || [];
    const option = group.options.find((o) => o.id === optionId);
    if (!option || option.isAvailable === false) return;

    const maxSelections = group.maxSelections || 1;

    if (currentSelections.includes(optionId)) {
      onSelectionChange(
        group.id,
        currentSelections.filter((id) => id !== optionId)
      );
    } else {
      if (maxSelections === 1) {
        onSelectionChange(group.id, [optionId]);
      } else {
        if (currentSelections.length < maxSelections) {
          onSelectionChange(group.id, [...currentSelections, optionId]);
        } else {
          const newSelections = [...currentSelections.slice(1), optionId];
          onSelectionChange(group.id, newSelections);
        }
      }
    }
  };

  const handleQuantityChange = (group: ToppingGroupWithOptions, optionId: string, delta: number) => {
    const option = group.options.find((o) => o.id === optionId);
    if (!option || option.isAvailable === false) return;

    const currentQuantity = quantities[group.id]?.[optionId] || 0;
    const maxQty = (group as any).maxQuantityPerOption || 10;
    const newQuantity = Math.max(0, Math.min(maxQty, currentQuantity + delta));
    
    if (onQuantityChange) {
      onQuantityChange(group.id, optionId, newQuantity);
    }
  };

  const getQuantity = (groupId: string, optionId: string) => {
    return quantities[groupId]?.[optionId] || 0;
  };

  const getValidationState = () => {
    const missingGroups: string[] = [];
    groups.forEach((group) => {
      if (group.isRequired) {
        const allowQuantity = (group as any).allowQuantity;
        if (allowQuantity) {
          const groupQuantities = quantities[group.id] || {};
          const totalQty = Object.values(groupQuantities).reduce((sum, q) => sum + q, 0);
          if (totalQty === 0) {
            missingGroups.push(group.headline);
          }
        } else {
          const groupSelections = selections[group.id] || [];
          if (groupSelections.length === 0) {
            missingGroups.push(group.headline);
          }
        }
      }
    });
    return { valid: missingGroups.length === 0, missingGroups };
  };

  const getTotalPrice = () => {
    let total = 0;
    groups.forEach((group) => {
      const allowQuantity = (group as any).allowQuantity;
      if (allowQuantity) {
        const groupQuantities = quantities[group.id] || {};
        Object.entries(groupQuantities).forEach(([optionId, qty]) => {
          const option = group.options.find((o) => o.id === optionId);
          if (option && qty > 0) {
            total += Number(option.price) * qty;
          }
        });
      } else {
        const groupSelections = selections[group.id] || [];
        groupSelections.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId);
          if (option) {
            total += Number(option.price);
          }
        });
      }
    });
    return total;
  };

  const isDarkTheme = themeColors.text === "#ffffff";

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupSelections = selections[group.id] || [];
        const maxSelections = group.maxSelections || 1;
        const isSingleSelect = maxSelections === 1;
        const allowQuantity = (group as any).allowQuantity;
        const maxQuantityPerOption = (group as any).maxQuantityPerOption || 10;

        return (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4
                  className="font-semibold text-base"
                  style={{ color: themeColors.text }}
                >
                  {group.headline}
                </h4>
                {group.isRequired && (
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(244, 114, 182, 0.15)",
                      color: "#ec4899",
                    }}
                  >
                    Required
                  </span>
                )}
              </div>
              {!allowQuantity && !isSingleSelect && (
                <span
                  className="text-xs opacity-60"
                  style={{ color: themeColors.text }}
                >
                  {(() => {
                    const minSel = (group as any).minSelections || 0;
                    if (minSel > 0 && minSel === maxSelections) {
                      return `Select exactly ${minSel}`;
                    } else if (minSel > 0) {
                      return `Select ${minSel} to ${maxSelections}`;
                    } else {
                      return `Select up to ${maxSelections}`;
                    }
                  })()}
                </span>
              )}
              {allowQuantity && (
                <span
                  className="text-xs opacity-60"
                  style={{ color: themeColors.text }}
                >
                  Max {maxQuantityPerOption} each
                </span>
              )}
            </div>

            <div className="space-y-0 rounded-xl overflow-hidden" style={{ 
              background: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` 
            }}>
              {group.options.map((option, optionIndex) => {
                const isSelected = groupSelections.includes(option.id);
                const quantity = getQuantity(group.id, option.id);
                const price = Number(option.price);
                const isSoldOut = option.isAvailable === false;
                const isLastOption = optionIndex === group.options.length - 1;

                if (allowQuantity) {
                  return (
                    <div
                      key={option.id}
                      className={`w-full flex items-center justify-between px-4 py-3.5 transition-all ${isSoldOut ? 'opacity-50' : ''}`}
                      style={{
                        background: isSoldOut
                          ? isDarkTheme ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                          : quantity > 0
                            ? themeColors.selectedBg
                            : "transparent",
                        borderBottom: !isLastOption ? `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}` : 'none',
                      }}
                      data-testid={`option-qty-${group.id}-${option.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {option.image && (
                          <img
                            src={option.image}
                            alt={option.name}
                            className={`w-10 h-10 rounded-lg object-cover ${isSoldOut ? 'grayscale' : ''}`}
                          />
                        )}
                        <span
                          className={`text-sm font-medium ${isSoldOut ? 'line-through' : ''}`}
                          style={{ color: isSoldOut ? (isDarkTheme ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)') : themeColors.text }}
                        >
                          {option.name}
                        </span>
                        {isSoldOut && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                            Sold Out
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {!isSoldOut ? (
                          <>
                            <span
                              className="text-sm font-medium min-w-[50px] text-right"
                              style={{
                                color: quantity > 0
                                  ? themeColors.primary
                                  : isDarkTheme ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                              }}
                            >
                              {price === 0
                                ? "Free"
                                : quantity > 0 
                                  ? `+${currencySymbol}${(price * quantity).toFixed(2)}`
                                  : `${currencySymbol}${price.toFixed(2)}`}
                            </span>
                            <div className="flex items-center gap-0.5 rounded-full p-0.5" style={{ background: isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }}>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(group, option.id, -1)}
                                disabled={quantity === 0}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                style={{
                                  background: quantity > 0 ? themeColors.primary : "transparent",
                                  color: quantity > 0 ? "white" : "rgba(0,0,0,0.25)",
                                  cursor: quantity === 0 ? "not-allowed" : "pointer",
                                }}
                                data-testid={`btn-minus-${option.id}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span
                                className="w-6 text-center text-sm font-medium"
                                style={{ color: themeColors.text }}
                              >
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(group, option.id, 1)}
                                disabled={quantity >= maxQuantityPerOption}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                style={{
                                  background: themeColors.primary,
                                  color: "white",
                                  cursor: quantity >= maxQuantityPerOption ? "not-allowed" : "pointer",
                                  opacity: quantity >= maxQuantityPerOption ? 0.5 : 1,
                                }}
                                data-testid={`btn-plus-${option.id}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 line-through">
                            +{currencySymbol}{price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => !isSoldOut && handleOptionClick(group, option.id)}
                    disabled={isSoldOut}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-all ${
                      isSoldOut ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                      background: isSoldOut
                        ? (isDarkTheme ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")
                        : isSelected
                          ? themeColors.selectedBg
                          : "transparent",
                      borderBottom: !isLastOption ? `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none',
                    }}
                    data-testid={`option-${group.id}-${option.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${
                          isSingleSelect ? "rounded-full" : "rounded"
                        }`}
                        style={{
                          borderColor: isSoldOut
                            ? (isDarkTheme ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)")
                            : isSelected
                              ? themeColors.primary
                              : (isDarkTheme ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"),
                          background: isSoldOut
                            ? "transparent"
                            : isSelected
                              ? themeColors.primary
                              : "transparent",
                        }}
                      >
                        {isSelected && !isSoldOut && (
                          isSingleSelect ? (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          ) : (
                            <Check className="h-3 w-3 text-white" />
                          )
                        )}
                      </div>
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.name}
                          className={`w-10 h-10 rounded-lg object-cover ${isSoldOut ? 'grayscale' : ''}`}
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${isSoldOut ? 'line-through' : ''}`}
                        style={{ color: isSoldOut ? (isDarkTheme ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)') : themeColors.text }}
                      >
                        {option.name}
                      </span>
                      {isSoldOut && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${isSoldOut ? 'line-through' : ''}`}
                      style={{
                        color: isSoldOut
                          ? (isDarkTheme ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)")
                          : isSelected
                            ? themeColors.primary
                            : (isDarkTheme ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"),
                      }}
                    >
                      {price === 0
                        ? "Free"
                        : `+${currencySymbol}${price.toFixed(2)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {getTotalPrice() > 0 && (
        <div
          className="pt-2 border-t flex justify-between text-sm font-medium"
          style={{
            borderColor: isDarkTheme ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
            color: themeColors.primary,
          }}
        >
          <span>Options total:</span>
          <span>
            +{currencySymbol}
            {getTotalPrice().toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

export function buildOptionGroupSelections(
  groups: ToppingGroupWithOptions[],
  selections: Record<string, string[]>,
  quantities?: Record<string, Record<string, number>>
): OptionGroupSelection[] {
  return groups
    .map((group) => {
      const allowQuantity = (group as any).allowQuantity;
      
      if (allowQuantity && quantities) {
        const groupQuantities = quantities[group.id] || {};
        const selectedOptions = Object.entries(groupQuantities)
          .filter(([_, qty]) => qty > 0)
          .map(([optionId, qty]) => {
            const option = group.options.find((o) => o.id === optionId);
            return option
              ? { id: option.id, name: option.name, price: Number(option.price), quantity: qty }
              : null;
          })
          .filter(Boolean) as { id: string; name: string; price: number; quantity: number }[];

        return {
          groupId: group.id,
          groupHeadline: group.headline,
          isRequired: group.isRequired || false,
          selectedOptions,
          halfType: (group as any).halfType || null,
        };
      }
      
      const selectedIds = selections[group.id] || [];
      const selectedOptions = selectedIds
        .map((id) => {
          const option = group.options.find((o) => o.id === id);
          return option
            ? { id: option.id, name: option.name, price: Number(option.price) }
            : null;
        })
        .filter(Boolean) as { id: string; name: string; price: number }[];

      return {
        groupId: group.id,
        groupHeadline: group.headline,
        isRequired: group.isRequired || false,
        selectedOptions,
        halfType: (group as any).halfType || null,
      };
    })
    .filter((g) => g.selectedOptions.length > 0);
}

export function validateOptionGroups(
  groups: ToppingGroupWithOptions[],
  selections: Record<string, string[]>,
  quantities?: Record<string, Record<string, number>>
): { valid: boolean; missingGroups: string[]; insufficientGroups: { name: string; required: number; selected: number }[] } {
  const missingGroups: string[] = [];
  const insufficientGroups: { name: string; required: number; selected: number }[] = [];

  groups.forEach((group) => {
    const minSelections = (group as any).minSelections || 0;
    const allowQuantity = (group as any).allowQuantity;
    
    if (allowQuantity && quantities) {
      const groupQuantities = quantities[group.id] || {};
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
      const groupSelections = selections[group.id] || [];
      
      if (group.isRequired && groupSelections.length === 0) {
        missingGroups.push(group.headline);
      } else if (minSelections > 0 && groupSelections.length < minSelections) {
        insufficientGroups.push({
          name: group.headline,
          required: minSelections,
          selected: groupSelections.length
        });
      }
    }
  });

  const allValid = missingGroups.length === 0 && insufficientGroups.length === 0;
  return { valid: allValid, missingGroups, insufficientGroups };
}
