import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Phone, MapPin, PieChart, User, Plus, Edit, Trash2, CheckCircle, XCircle, Users, TrendingUp } from "lucide-react";
import { customerApi, type CustomerRecord } from "@/services/api";
import { formatINRTextToUnits } from "@/lib/money";

type TotalDataEntry = CustomerRecord;

const TotalDataForm = () => {
  const [entries, setEntries] = useState<TotalDataEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TotalDataEntry | null>(null);
  
  // Form state
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [interested, setInterested] = useState(false);
  const [recordOwner, setRecordOwner] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch total data entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await customerApi.list();
      if (response.success) {
        setEntries(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch total data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Reset form
  const resetForm = () => {
    setContactName("");
    setContactNumber("");
    setLocation("");
    setBudget("");
    setInterested(false);
    setRecordOwner("");
    setNotes("");
    setEditingEntry(null);
    setShowForm(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactName || !contactNumber || !location || !budget || !recordOwner) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      
      const entryData = {
        contactName,
        contactNumber,
        location,
        budget,
        interested,
        recordOwner,
        notes
      };

      if (editingEntry) {
        // Update existing entry
        await customerApi.update(editingEntry.id, entryData);
        toast.success("Total data entry updated successfully");
      } else {
        // Create new entry
        await customerApi.create(entryData);
        toast.success("Total data entry created successfully");
      }

      resetForm();
      fetchEntries();
    } catch (error) {
      toast.error("Failed to save total data entry");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (entry: TotalDataEntry) => {
    setEditingEntry(entry);
    setContactName(entry.contactName);
    setContactNumber(entry.contactNumber);
    setLocation(entry.location);
    setBudget(entry.budget);
    setInterested(entry.interested);
    setRecordOwner(entry.recordOwner);
    setNotes(entry.notes ?? "");
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      setLoading(true);
      await customerApi.remove(id);
      toast.success("Total data entry deleted successfully");
      fetchEntries();
    } catch (error) {
      toast.error("Failed to delete total data entry");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: entries.length,
    interested: entries.filter(e => e.interested).length,
    notInterested: entries.filter(e => !e.interested).length,
    conversionRate: entries.length > 0 ? ((entries.filter(e => e.interested).length / entries.length) * 100).toFixed(1) : '0'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Total Data</h1>
          <p className="text-gray-600 mt-1">Manage all customer data (interested and not interested)</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Entries</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Interested</p>
                <p className="text-2xl font-bold text-green-900">{stats.interested}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Not Interested</p>
                <p className="text-2xl font-bold text-red-900">{stats.notInterested}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-900">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEntry ? 'Edit Total Data Entry' : 'Add Total Data Entry'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name *</Label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Enter contact name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Number *</Label>
                    <Input
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Units *</Label>
                    <Input
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="15,00,000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Record Owner *</Label>
                    <Select value={recordOwner} onValueChange={setRecordOwner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select record owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="John Employee">John Employee</SelectItem>
                        <SelectItem value="Jane Employee">Jane Employee</SelectItem>
                        <SelectItem value="Sarah Jones">Sarah Jones</SelectItem>
                        <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                        <SelectItem value="Lisa Anderson">Lisa Anderson</SelectItem>
                        <SelectItem value="Robert Smith">Robert Smith</SelectItem>
                        <SelectItem value="Christopher Lee">Christopher Lee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interest Status</Label>
                    <Select value={interested.toString()} onValueChange={(value) => setInterested(value === 'true')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Interested</SelectItem>
                        <SelectItem value="false">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter additional notes..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingEntry ? 'Update' : 'Save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Total Data Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Contact Name</th>
                    <th className="text-left p-3 font-medium">Contact Number</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Units</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Record Owner</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-500" />
                          {entry.contactName}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          {entry.contactNumber}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          {entry.location}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <PieChart className="w-4 h-4 mr-2 text-gray-500" />
                          {formatINRTextToUnits(entry.budget)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          entry.interested 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.interested ? 'Interested' : 'Not Interested'}
                        </span>
                      </td>
                      <td className="p-3">{entry.recordOwner}</td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {entries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No total data entries found. Click "Add Entry" to create one.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TotalDataForm;
