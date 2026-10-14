import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User, Phone, MapPin, Hash, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { leadApi, type Lead, type Plot } from "@/services/api";
import { formatINRUnits } from "@/lib/money";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  plot: Plot;
  open: boolean;
  onClose: () => void;
  onAddNewLead: () => void;
}

const ExistingLeadsDialog = ({ plot, open, onClose, onAddNewLead }: Props) => {
  const { user } = useAuth();
  const isEditor = user?.role === "ADMIN" || user?.role === "EMPLOYEE";
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editedLeads, setEditedLeads] = useState<Lead[]>([]);
  const [dirtyLeads, setDirtyLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && plot.id) {
      setLoading(true);
      setEditedLeads(plot.leads || []);
      setDirtyLeads([]);
      setLoading(false);
    }
  }, [open, plot.id, plot.leads]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleEditLead = (leadId: string) => {
    setEditingLead(leadId);
  };

  const handleFieldChange = (leadId: string, field: keyof Lead, value: any) => {
    setEditedLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, [field]: value } : lead))
    );
    if (!dirtyLeads.includes(leadId)) {
      setDirtyLeads((prev) => [...prev, leadId]);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!isEditor) return;
    try {
      await leadApi.remove(leadId);
      setEditedLeads((prev) => prev.filter((lead) => lead.id !== leadId));
      toast.success("Lead deleted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete lead");
    }
  };

  const handleSaveAllChanges = async () => {
    if (!isEditor) return;
    try {
      for (const leadId of dirtyLeads) {
        const lead = editedLeads.find((item) => item.id === leadId);
        if (!lead) continue;
        await leadApi.update(leadId, {
          contactNumber: lead.contactNumber,
          location: lead.location,
          uniqueId: lead.uniqueId,
          pricePerSqYard: lead.pricePerSqYard
        });
      }
      setDirtyLeads([]);
      setEditingLead(null);
      toast.success("All changes saved successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save updates");
    }
  };

  const statusLabel = plot.status === "AVAILABLE" ? "Available" : plot.status === "ADVANCE" ? "Advance Paid" : "Sold";
  const statusVariant = plot.status === "AVAILABLE" ? "default" : plot.status === "ADVANCE" ? "secondary" : "destructive";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Existing Leads - Plot {plot.plotNumber}
            </div>
            <Badge variant="secondary">
              {editedLeads.length} {editedLeads.length === 1 ? "Lead" : "Leads"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Plot Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Plot Number:</span>
                <span className="ml-2 font-medium">{plot.plotNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Area:</span>
                <span className="ml-2 font-medium">{plot.area} sq. yards</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={statusVariant} className="ml-2">
                  {statusLabel}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Total Leads:</span>
                <span className="ml-2 font-medium">{editedLeads.length}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Customer Leads</h3>

            {editedLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{loading ? "Loading leads..." : "No existing leads found for this plot."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    <p>Loading leads...</p>
                  </div>
                ) : (
                  editedLeads.map((lead, index) => (
                    <div key={lead.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{lead.customerName}</h4>
                            <p className="text-sm text-gray-600">Lead #{index + 1}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{formatDate(lead.createdAt)}</Badge>
                          {isEditor && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditLead(lead.id)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {editingLead === lead.id ? (
                            <Input
                              value={lead.contactNumber}
                              onChange={(e) => handleFieldChange(lead.id, "contactNumber", e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-700">{lead.contactNumber}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {editingLead === lead.id ? (
                            <Input
                              value={lead.location}
                              onChange={(e) => handleFieldChange(lead.id, "location", e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-700">{lead.location}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-500" />
                          {editingLead === lead.id ? (
                            <Input
                              value={lead.uniqueId}
                              onChange={(e) => handleFieldChange(lead.id, "uniqueId", e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-700">{lead.uniqueId}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          {editingLead === lead.id ? (
                            <Input
                              type="number"
                              value={lead.pricePerSqYard?.toString()}
                              onChange={(e) => handleFieldChange(lead.id, "pricePerSqYard", parseInt(e.target.value, 10))}
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-700">{formatINRUnits(lead.pricePerSqYard || 0)}/sq.yard</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {isEditor && dirtyLeads.length > 0 && (
              <Button onClick={handleSaveAllChanges} className="flex-1">
                Save Changes
              </Button>
            )}
            {isEditor && (
              <Button onClick={onAddNewLead} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add New Lead
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExistingLeadsDialog;
