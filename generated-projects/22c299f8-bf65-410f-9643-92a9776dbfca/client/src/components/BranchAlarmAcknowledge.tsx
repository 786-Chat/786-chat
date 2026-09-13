import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BellOff, Bug } from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function getPestLabel(device: any): { icon: string; label: string } {
  const activeCode = Array.isArray(device?.lastStatus)
    ? device.lastStatus.find((status: any) => status?.value === true)?.code
    : "";

  const text = [
    activeCode,
    device?.pestType,
    device?.trapType,
    device?.deviceType,
    device?.deviceName,
    device?.name,
    device?.notes,
    device?.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("cockroach") || text.includes("roach") || text.includes("insect")) {
    return { icon: "🪳", label: "Cockroach" };
  }
  if (text.includes("rat")) return { icon: "🐀", label: "Rat" };
  if (text.includes("mouse") || text.includes("mouser")) return { icon: "🐭", label: "Mouse" };
  return { icon: "⚠️", label: "Pest trap" };
}

export default function BranchAlarmAcknowledge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data } = useQuery<any[]>({
    queryKey: ["/api/branch/iot-devices"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const activeDevices = (Array.isArray(data) ? data : []).filter((device: any) => device?.alarmActive);

  const acknowledgeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiRequest("POST", `/api/branch/iot-devices/${encodeURIComponent(deviceId)}/acknowledge`, {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/branch/iot-devices"] });
      toast({
        title: "Alarm acknowledged",
        description: "The current customer alarm has been stopped. It will return if the physical trap is still triggered.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not stop alarm",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (activeDevices.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] w-[calc(100vw-2rem)] max-w-md rounded-2xl border-2 border-red-500/70 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
      role="alert"
      aria-live="assertive"
      data-testid="customer-smart-trap-alarm"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/20">
          <AlertTriangle className="h-5 w-5 text-red-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-red-200">Pest trap alarm</p>
          <p className="text-sm text-slate-300">
            Mouse, rat or cockroach activity has been detected. Check the trap before acknowledging the alert.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {activeDevices.map((device: any) => {
          const pest = getPestLabel(device);
          const pending = acknowledgeMutation.isPending && acknowledgeMutation.variables === device.id;
          return (
            <div key={device.id} className="rounded-xl border border-red-500/30 bg-red-950/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{pest.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{pest.label}: {device.deviceName || "Smart device"}</p>
                  {device.lastAlarmAt && (
                    <p className="text-xs text-red-300">Triggered {new Date(device.lastAlarmAt).toLocaleString()}</p>
                  )}
                </div>
                <Bug className="h-4 w-4 flex-shrink-0 text-red-300" />
              </div>
              <Button
                type="button"
                onClick={() => acknowledgeMutation.mutate(device.id)}
                disabled={acknowledgeMutation.isPending}
                className="w-full bg-red-600 text-white hover:bg-red-700"
                data-testid={`button-acknowledge-alarm-${device.id}`}
              >
                <BellOff className="mr-2 h-4 w-4" />
                {pending ? "Stopping alarm..." : "Stop Alarm / Acknowledge"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
