import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, MapPin, Calendar, DollarSign } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { leadApi, plotApi, type Plot } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateLeadDialog = ({ open, onClose, onSuccess }: Props) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    plotId: "",
    plotNumber: "",
    ventureName: "",
    customerName: "",
    email: "",
    phone: "",
    location: "",
    assignedAgent: "",
    notes: "",
    nextFollowUp: "",
    pricePerSqYard: ""
  });
  const [loading, setLoading] = useState(false);

  const { data: plotsResponse } = useQuery({
    queryKey: ["plots"],
    queryFn: () => plotApi.list({ pageSize: 200 })
  });

  const plots = useMemo(() => plotsResponse?.data ?? [], [plotsResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.phone || !formData.location || !formData.plotId || !formData.email) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      await leadApi.create({
        plotId: formData.plotId,
        plotNumber: formData.plotNumber,
        customerName: formData.customerName,
        email: formData.email,
        contactNumber: formData.phone,
        location: formData.location,
        uniqueId: `LEAD-${Date.now()}`,
        pricePerSqYard: Number(formData.pricePerSqYard) || 0,
        notes: formData.notes
      });

      toast.success("Lead created successfully!");

      setFormData({
        plotId: "",
        plotNumber: "",
        ventureName: "",
        customerName: "",
        email: "",
        phone: "",
        location: "",
        assignedAgent: "",
        notes: "",
        nextFollowUp: "",
        pricePerSqYard: ""
      });

      onClose();
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["customer-records"] });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlotSelect = (plotId: string) => {
    const selected = plots.find((plot: Plot) => plot.id === plotId);
    if (!selected) {
      handleInputChange("plotId", plotId);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      plotId: selected.id,
      plotNumber: selected.plotNumber,
      ventureName: selected.venture?.name || "",
      location: selected.venture?.location?.name || prev.location,
      pricePerSqYard: selected.pricePerSqYard ? String(selected.pricePerSqYard) : prev.pricePerSqYard
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Create New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                placeholder="Enter customer name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="customer@email.com"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+91 9876543210"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter location"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="plotId">Plot *</Label>
              <Select value={formData.plotId} onValueChange={handlePlotSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select plot" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((plot: Plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.plotNumber} - {plot.venture?.name || "Venture"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pricePerSqYard" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price per Sq.Yard
              </Label>
              <Input
                id="pricePerSqYard"
                type="number"
                value={formData.pricePerSqYard}
                onChange={(e) => handleInputChange("pricePerSqYard", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="plotNumber">Plot Number</Label>
              <Input
                id="plotNumber"
                value={formData.plotNumber}
                onChange={(e) => handleInputChange("plotNumber", e.target.value)}
                placeholder="A-101"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ventureName">Venture Name</Label>
              <Input
                id="ventureName"
                value={formData.ventureName}
                onChange={(e) => handleInputChange("ventureName", e.target.value)}
                placeholder="Venture name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="assignedAgent">Assigned Agent</Label>
              <Input
                id="assignedAgent"
                value={formData.assignedAgent}
                onChange={(e) => handleInputChange("assignedAgent", e.target.value)}
                placeholder="Agent name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="nextFollowUp" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Next Follow-up
              </Label>
              <Input
                id="nextFollowUp"
                type="date"
                value={formData.nextFollowUp}
                onChange={(e) => handleInputChange("nextFollowUp", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes about this lead..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadDialog;
