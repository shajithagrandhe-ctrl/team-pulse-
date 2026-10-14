import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Phone, MapPin, PieChart, Calendar, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { leadApi } from "@/services/api";

interface CustomerReport {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  location: string;
  status: "green" | "orange" | "red" | "converted";
  assignedAgent: string;
  plotNumber: string;
  ventureName: string;
  lastContact: string;
  nextFollowUp: string;
  notes: string;
  createdAt: string;
  totalInteractions: number;
  conversionProbability: number;
  pricePerSqYard?: number;
  plotArea?: number;
}

interface Props {
  customer: CustomerReport | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (updatedCustomer: CustomerReport) => void;
}

const CustomerDetailModal = ({ customer, open, onClose, onUpdate }: Props) => {
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    location: "",
    plotNumber: "",
    ventureName: "",
    plotArea: "",
    pricePerSqYard: "",
    notes: "",
    nextFollowUp: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      const plotArea = customer.plotArea || 120;
      const pricePerSqYard = customer.pricePerSqYard || 5000;

      setFormData({
        customerName: customer.customerName,
        email: customer.email,
        phone: customer.phone,
        location: customer.location,
        plotNumber: customer.plotNumber,
        ventureName: customer.ventureName,
        plotArea: plotArea.toString(),
        pricePerSqYard: pricePerSqYard.toString(),
        notes: customer.notes,
        nextFollowUp: customer.nextFollowUp
      });
    }
  }, [customer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const mapStatusToLead = (status: CustomerReport["status"]) => {
    switch (status) {
      case "orange":
        return "FOLLOW_UP";
      case "red":
        return "QUALIFIED";
      case "converted":
        return "WON";
      case "green":
      default:
        return "NEW";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setLoading(true);

    try {
      let newStatus: CustomerReport["status"] = customer.status;
      if (customer.status === "green") newStatus = "orange";
      else if (customer.status === "orange") newStatus = "red";
      else if (customer.status === "red") newStatus = "converted";

      let conversionProbability = customer.conversionProbability;
      if (newStatus === "orange") conversionProbability = 85;
      else if (newStatus === "red") conversionProbability = 95;
      else if (newStatus === "converted") conversionProbability = 100;

      await leadApi.update(customer.id, {
        status: mapStatusToLead(newStatus),
        pricePerSqYard: parseInt(formData.pricePerSqYard, 10) || customer.pricePerSqYard,
        contactNumber: formData.phone,
        location: formData.location,
        notes: formData.notes
      });

      const updatedCustomer: CustomerReport = {
        ...customer,
        ...formData,
        status: newStatus,
        conversionProbability,
        pricePerSqYard: parseInt(formData.pricePerSqYard, 10) || customer.pricePerSqYard || 0,
        plotArea: parseInt(formData.plotArea, 10) || customer.plotArea || 0,
        lastContact: new Date().toISOString().split("T")[0],
        totalInteractions: customer.totalInteractions + 1
      };

      toast.success("Customer status updated successfully");
      onUpdate?.(updatedCustomer);
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "orange":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "red":
        return "bg-red-100 text-red-800 border-red-200";
      case "converted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "green":
        return "New Lead";
      case "orange":
        return "Hot Lead";
      case "red":
        return "Ready to Close";
      case "converted":
        return "Converted";
      default:
        return "Unknown";
    }
  };

  const getNextStatusButton = () => {
    if (!customer) return null;

    if (customer.status === "green") {
      return (
        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
          Update to Hot Lead
        </Button>
      );
    }
    if (customer.status === "orange") {
      return (
        <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
          Update to Ready to Close
        </Button>
      );
    }
    if (customer.status === "red") {
      return (
        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
          Mark as Converted
        </Button>
      );
    }

    return null;
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Customer Details
            <Badge className={getStatusColor(customer.status)}>{getStatusText(customer.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Number *
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1"
                  required
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
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Plot Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plotNumber">Plot Number</Label>
                <Input
                  id="plotNumber"
                  value={formData.plotNumber}
                  onChange={(e) => handleInputChange("plotNumber", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ventureName">Venture Name</Label>
                <Input
                  id="ventureName"
                  value={formData.ventureName}
                  onChange={(e) => handleInputChange("ventureName", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="plotArea">Plot Area (sq. yards)</Label>
                <Input
                  id="plotArea"
                  type="number"
                  value={formData.plotArea}
                  onChange={(e) => handleInputChange("plotArea", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pricePerSqYard" className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Units per Sq.Yard *
                </Label>
                <Input
                  id="pricePerSqYard"
                  type="number"
                  value={formData.pricePerSqYard}
                  onChange={(e) => handleInputChange("pricePerSqYard", e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

            <div>
              <Label htmlFor="nextFollowUp" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Next Follow-up Date
              </Label>
              <Input
                id="nextFollowUp"
                type="date"
                value={formData.nextFollowUp}
                onChange={(e) => handleInputChange("nextFollowUp", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Add any additional notes about this customer..."
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Current Status Progress</h4>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full ${
                customer.status === "green" || ["orange", "red", "converted"].includes(customer.status) ? "bg-green-500" : "bg-gray-300"
              }`}></div>
              <span className={customer.status === "green" ? "font-medium" : "text-gray-500"}>New Lead</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-4 h-4 rounded-full ${
                customer.status === "orange" || ["red", "converted"].includes(customer.status) ? "bg-orange-500" : "bg-gray-300"
              }`}></div>
              <span className={customer.status === "orange" ? "font-medium" : "text-gray-500"}>Hot Lead</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-4 h-4 rounded-full ${
                customer.status === "red" || customer.status === "converted" ? "bg-red-500" : "bg-gray-300"
              }`}></div>
              <span className={customer.status === "red" ? "font-medium" : "text-gray-500"}>Ready to Close</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className={`w-4 h-4 rounded-full ${customer.status === "converted" ? "bg-blue-500" : "bg-gray-300"}`}></div>
              <span className={customer.status === "converted" ? "font-medium" : "text-gray-500"}>Converted</span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span>Conversion Probability:</span>
                <span className="font-semibold">{customer.conversionProbability}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${customer.conversionProbability}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            {getNextStatusButton()}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailModal;
