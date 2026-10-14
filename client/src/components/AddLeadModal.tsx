import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Phone, MapPin, Hash, DollarSign, Camera, Upload, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (leadData: any) => void;
  locationName: string;
  customer?: any;
}

const AddLeadModal = ({ open, onClose, onSubmit, locationName, customer }: Props) => {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    contactNumber: '',
    location: '',
    uniqueId: '',
    pricePerSqYard: '',
    photo: null,
    plotNumber: '',
    ventureName: '',
    notes: ''
  });

  useEffect(() => {
    if (open) {
      // Pre-fill form with customer data or defaults
      setFormData({
        customerName: customer?.customerName || '',
        email: customer?.email || '',
        contactNumber: customer?.contactNumber || '',
        location: customer?.location || locationName,
        uniqueId: customer?.uniqueId || `ID-${Date.now()}`,
        pricePerSqYard: customer?.pricePerSqYard?.toString() || '',
        photo: customer?.photo || null,
        plotNumber: customer?.plotNumber || '',
        ventureName: customer?.ventureName || '',
        notes: customer?.notes || ''
      });
    }
  }, [open, customer]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.contactNumber || !formData.pricePerSqYard || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Add New Lead - {locationName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
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
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Number *
                </Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
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
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="uniqueId" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Unique ID
                </Label>
                <Input
                  id="uniqueId"
                  value={formData.uniqueId}
                  onChange={(e) => handleInputChange('uniqueId', e.target.value)}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Plot Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Plot Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plotNumber">Plot Number</Label>
                <Input
                  id="plotNumber"
                  value={formData.plotNumber}
                  onChange={(e) => handleInputChange('plotNumber', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="ventureName">Venture Name</Label>
                <Input
                  id="ventureName"
                  value={formData.ventureName}
                  onChange={(e) => handleInputChange('ventureName', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing Information
            </h3>
            
            <div>
              <Label htmlFor="pricePerSqYard" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price per Sq.Yard *
              </Label>
              <Input
                id="pricePerSqYard"
                type="number"
                value={formData.pricePerSqYard}
                onChange={(e) => handleInputChange('pricePerSqYard', e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo
            </h3>
            
            <div>
              <Label htmlFor="photo">Upload Photo</Label>
              <div className="mt-1 flex items-center gap-4">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="flex-1"
                />
                {formData.photo && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Upload className="w-4 h-4" />
                    Photo uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Add any additional notes about this lead..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadModal;
