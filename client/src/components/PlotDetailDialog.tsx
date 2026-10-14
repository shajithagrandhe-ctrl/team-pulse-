import { useEffect, useState } from "react";
import { type Plot, plotApi } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  plot: Plot;
  open: boolean;
  onClose: () => void;
  onAddLead: () => void;
}

const statusLabel: Record<string, string> = {
  AVAILABLE: "Available",
  ADVANCE: "Advance Paid",
  SOLD: "Sold"
};

const PlotDetailDialog = ({ plot, open, onClose, onAddLead }: Props) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditor = user?.role === "ADMIN" || user?.role === "EMPLOYEE";
  const [status, setStatus] = useState<Plot["status"]>(plot.status);
  const [isSaving, setIsSaving] = useState(false);
  const statusKey = plot.status;
  const leads = plot.leads || [];

  useEffect(() => {
    setStatus(plot.status);
  }, [plot.status]);

  const handleStatusSave = async () => {
    if (status === plot.status) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      await plotApi.update(plot.id, { status });
      await queryClient.invalidateQueries({ queryKey: ["venture", plot.ventureId] });
      await queryClient.invalidateQueries({ queryKey: ["plots"] });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Plot status updated");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update plot");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Plot No: {plot.plotNumber}
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                plot.status === "AVAILABLE" && "bg-plot-available/10 text-plot-available",
                plot.status === "ADVANCE" && "bg-plot-advance/10 text-plot-advance",
                plot.status === "SOLD" && "bg-plot-sold/10 text-plot-sold"
              )}
            >
              {statusLabel[statusKey]}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Area</span>
            <span className="font-medium text-foreground">{plot.area} sq. yards</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Leads Generated</span>
            <span className="font-medium text-foreground">{leads.length}</span>
          </div>

          {leads.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Customer Leads</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {leads.map((lead) => (
                  <div key={lead.id} className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">{lead.customerName}</p>
                    <p className="text-xs text-muted-foreground">{lead.contactNumber} - {lead.uniqueId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditor && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="text-sm font-medium text-foreground">Update Status</div>
              <Select value={status} onValueChange={(value) => setStatus(value as Plot["status"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ADVANCE">Advance Paid</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleStatusSave} className="w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Status"}
              </Button>
            </div>
          )}

          {isEditor && plot.status !== "SOLD" && (
            <Button onClick={onAddLead} className="w-full" variant={isEditor ? "outline" : "default"}>
              {plot.status === "AVAILABLE" ? "Add Customer Lead" : "Process Payment"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlotDetailDialog;
