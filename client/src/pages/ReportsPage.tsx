import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, User, Phone, MapPin, Calendar, TrendingUp, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import CreateLeadDialog from "@/components/CreateLeadDialog";
import CustomerDetailModal from "@/components/CustomerDetailModal";
import { leadApi, type Lead } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

// Lead status types
type LeadStatus = "green" | "orange" | "red" | "converted";

interface CustomerReport {
  id: string;
  _id: string;
  plotId: string;
  plotNumber: string;
  customerName: string;
  email: string;
  phone: string;
  location: string;
  uniqueId: string;
  pricePerSqYard: number;
  paymentMethod: "online" | "cash";
  notes: string;
  photo?: string;
  status: LeadStatus;
  assignedAgent: string;
  ventureName: string;
  lastContact: string;
  nextFollowUp: string;
  createdAt: string;
  updatedAt: string;
  totalInteractions: number;
  conversionProbability: number;
}

const mapLeadStatus = (status?: Lead["status"]): LeadStatus => {
  switch (status) {
    case "FOLLOW_UP":
      return "orange";
    case "QUALIFIED":
      return "orange";
    case "WON":
      return "red";
    case "LOST":
      return "converted";
    case "NEW":
    default:
      return "green";
  }
};

const mapLeadToReport = (lead: Lead): CustomerReport => {
  return {
    id: lead.id,
    _id: lead.id,
    plotId: lead.plotId,
    plotNumber: lead.plot?.plotNumber || "N/A",
    customerName: lead.customerName,
    email: lead.email,
    phone: lead.contactNumber,
    location: lead.location,
    uniqueId: lead.uniqueId,
    pricePerSqYard: lead.pricePerSqYard,
    paymentMethod: "online",
    notes: lead.notes ?? "",
    photo: lead.photoUrl,
    status: mapLeadStatus(lead.status),
    assignedAgent: lead.plot?.venture?.name ? "Assigned" : "Unassigned",
    ventureName: lead.plot?.venture?.name || "N/A",
    lastContact: lead.updatedAt?.split("T")[0] || lead.createdAt?.split("T")[0] || "",
    nextFollowUp: "",
    createdAt: lead.createdAt?.split("T")[0] || "",
    updatedAt: lead.updatedAt?.split("T")[0] || "",
    totalInteractions: 1,
    conversionProbability: 65
  };
};

const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerReport | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);

  const { data: leadsResponse, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => leadApi.list(1, 200)
  });

  const reports = useMemo(() => (leadsResponse?.data ?? []).map(mapLeadToReport), [leadsResponse]);

  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.phone.includes(searchTerm) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.plotNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (agentFilter !== "all") {
      filtered = filtered.filter((report) => report.assignedAgent === agentFilter);
    }

    return filtered;
  }, [reports, searchTerm, statusFilter, agentFilter]);

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "green":
        return "bg-green-100 text-green-800";
      case "orange":
        return "bg-orange-100 text-orange-800";
      case "red":
        return "bg-red-100 text-red-800";
      case "converted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: LeadStatus) => {
    switch (status) {
      case "green":
        return "Available";
      case "orange":
        return "Advance Paid";
      case "red":
        return "Sold";
      case "converted":
        return "Converted";
      default:
        return "Unknown";
    }
  };

  const handleViewCustomer = (customer: CustomerReport) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleExportData = () => {
    const csvContent = [
      ["Customer Name", "Email", "Phone", "Location", "Status", "Agent", "Plot Number", "Venture", "Last Contact", "Created"],
      ...filteredReports.map((report) => [
        report.customerName,
        report.email,
        report.phone,
        report.location,
        getStatusText(report.status),
        report.assignedAgent,
        report.plotNumber,
        report.ventureName,
        report.lastContact,
        report.createdAt
      ])
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-reports-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Reports exported successfully!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Customer Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and track customer leads and conversions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Leads</p>
                <p className="text-2xl font-bold text-card-foreground">{filteredReports.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredReports.filter((r) => r.status === "green").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Advance Paid</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredReports.filter((r) => r.status === "orange").length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sold</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredReports.filter((r) => r.status === "red").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="green">Available</SelectItem>
                  <SelectItem value="orange">Advance Paid</SelectItem>
                  <SelectItem value="red">Sold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateLead(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Loading leads...
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No customer reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground">{report.customerName}</p>
                          <p className="text-sm text-gray-500">{report.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{report.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{report.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>{getStatusText(report.status)}</Badge>
                      </TableCell>
                      <TableCell>{report.assignedAgent}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground">{report.plotNumber}</p>
                          <p className="text-sm text-gray-500">{report.ventureName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{report.lastContact}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(report)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showCustomerDetails && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          open={showCustomerDetails}
          onClose={() => setShowCustomerDetails(false)}
        />
      )}

      {showCreateLead && (
        <CreateLeadDialog open={showCreateLead} onClose={() => setShowCreateLead(false)} />
      )}
    </div>
  );
};

export default ReportsPage;
