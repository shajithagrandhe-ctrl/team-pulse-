import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Phone, MapPin, PieChart, User, Plus, Settings, Search } from "lucide-react";
import { customerApi, userApi, type CustomerRecord } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatINRTextToUnits } from "@/lib/money";

const TotalData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [formData, setFormData] = useState({
    contactName: "",
    contactNumber: "",
    location: "",
    budget: "",
    recordOwner: "",
    interested: false
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);
  const [newOwner, setNewOwner] = useState("");

  const { data: recordsResponse } = useQuery({
    queryKey: ["customer-records"],
    queryFn: () => customerApi.list(1, 200)
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ["employees"],
    queryFn: userApi.employees
  });

  const records = recordsResponse?.data ?? [];
  const employees = employeesResponse?.data ?? [];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactName || !formData.contactNumber || !formData.location || !formData.budget || !formData.recordOwner) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await customerApi.create(formData);
      toast.success("Customer record added successfully!");
      setFormData({
        contactName: "",
        contactNumber: "",
        location: "",
        budget: "",
        recordOwner: "",
        interested: false
      });
      queryClient.invalidateQueries({ queryKey: ["customer-records"] });
    } catch (error: any) {
      toast.error(error?.message || "Failed to add record");
    }
  };

  const handleReset = () => {
    setFormData({
      contactName: "",
      contactNumber: "",
      location: "",
      budget: "",
      recordOwner: "",
      interested: false
    });
  };

  const handleOwnerChange = async () => {
    if (!selectedRecord || !newOwner) return;

    try {
      await customerApi.update(selectedRecord.id, {
        contactName: selectedRecord.contactName,
        contactNumber: selectedRecord.contactNumber,
        location: selectedRecord.location,
        budget: selectedRecord.budget,
        interested: selectedRecord.interested,
        recordOwner: newOwner,
        notes: selectedRecord.notes
      });

      toast.success(`Record owner changed from ${selectedRecord.recordOwner} to ${newOwner}`);
      setSelectedRecord(null);
      setNewOwner("");
      queryClient.invalidateQueries({ queryKey: ["customer-records"] });
    } catch (error: any) {
      toast.error(error?.message || "Failed to update record owner");
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) =>
      record.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.contactNumber.includes(searchTerm) ||
      record.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.budget.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recordOwner.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [records, searchTerm]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Total Data</h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {isAdmin ? "Admin" : "Employee"} Mode
            </span>
            {user && <span className="text-sm text-gray-600">Logged in as: {user.email}</span>}
          </div>
        </div>
        <p className="text-muted-foreground">
          {isAdmin ? "Add customer records and manage record ownership" : "Add customer records to the system"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Customer Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contact Name *
                </Label>
                <Input
                  id="contactName"
                  type="text"
                  placeholder="Enter customer name"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange("contactName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Number *
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Units *
                </Label>
                <Input
                  id="budget"
                  type="text"
                  placeholder="Enter units (e.g., 15,00,000)"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recordOwner" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Record Owner *
                </Label>
                <Select value={formData.recordOwner} onValueChange={(value) => handleInputChange("recordOwner", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select record owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.fullName}>
                        {employee.fullName} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Customer Status</Label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="interested"
                      checked={formData.interested === true}
                      onChange={() => handleInputChange("interested", true)}
                      className="text-blue-600"
                    />
                    <span>Interested</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="interested"
                      checked={formData.interested === false}
                      onChange={() => handleInputChange("interested", false)}
                      className="text-blue-600"
                    />
                    <span>Not Interested</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Add Record</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Reset Form</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Records</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {filteredRecords.length} of {records.length}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-600 mb-2">No records found</div>
                <div className="text-sm text-gray-400">Try adjusting your search criteria</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-card-foreground mb-1">{record.contactName}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            {record.contactNumber}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {record.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <PieChart className="w-3 h-3" />
                            {formatINRTextToUnits(record.budget)}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{record.recordOwner}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                            record.interested ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.interested ? "Interested" : "Not Interested"}
                        </div>
                        <div className="space-y-2">
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(record);
                                setNewOwner("");
                              }}
                              className="flex items-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Change Owner
                            </Button>
                          )}
                          {selectedRecord?.id === record.id && isAdmin && (
                            <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                              <h4 className="font-semibold mb-2">Change Record Owner</h4>
                              <div className="space-y-2 mb-3">
                                <div className="text-sm">
                                  <span className="text-gray-600">Current:</span>
                                  <span className="font-medium text-card-foreground ml-1">{selectedRecord.recordOwner}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-600">Customer:</span>
                                  <span className="font-medium text-card-foreground ml-1">{selectedRecord.contactName}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Select New Owner</Label>
                                <Select value={newOwner} onValueChange={setNewOwner}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select new owner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employees
                                      .filter((emp) => emp.fullName !== selectedRecord.recordOwner)
                                      .map((emp) => (
                                        <SelectItem key={emp.id} value={emp.fullName}>
                                          {emp.fullName} - {emp.position}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleOwnerChange} disabled={!newOwner} className="flex-1">
                                  Update Owner
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRecord(null);
                                    setNewOwner("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{record.createdAt?.split("T")[0]}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredRecords.length > 10 && (
                  <div className="text-center pt-4">
                    <div className="text-sm text-gray-500">Showing 10 of {filteredRecords.length} records</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TotalData;
