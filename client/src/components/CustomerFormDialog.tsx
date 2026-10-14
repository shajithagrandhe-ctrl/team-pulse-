import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  plotNumber: string;
  open: boolean;
  onClose: () => void;
  isAdvancePayment: boolean;
}

const CustomerFormDialog = ({ plotNumber, open, onClose, isAdvancePayment }: Props) => {
  const [form, setForm] = useState({
    contactName: "",
    contactNumber: "",
    location: "",
    uniqueId: "",
    pricePerSqYard: "",
    paymentMode: "cash" as "cash" | "online",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(isAdvancePayment ? "Payment processed! Plot status updated." : "Customer lead added successfully!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAdvancePayment ? "Process Payment" : "Customer Details"} — Plot {plotNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Contact Number</Label>
            <Input value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} required />
          </div>
          {!isAdvancePayment && (
            <>
              <div className="space-y-2">
                <Label>Unique ID</Label>
                <Input value={form.uniqueId} onChange={e => setForm({...form, uniqueId: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Price / Sq. Yard</Label>
                <Input type="number" value={form.pricePerSqYard} onChange={e => setForm({...form, pricePerSqYard: e.target.value})} required />
              </div>
            </>
          )}
          {isAdvancePayment && (
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <div className="flex gap-3">
                <Button type="button" variant={form.paymentMode === "cash" ? "default" : "outline"} size="sm" onClick={() => setForm({...form, paymentMode: "cash"})}>
                  Cash
                </Button>
                <Button type="button" variant={form.paymentMode === "online" ? "default" : "outline"} size="sm" onClick={() => setForm({...form, paymentMode: "online"})}>
                  Online
                </Button>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormDialog;
