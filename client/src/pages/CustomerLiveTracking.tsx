import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, Phone, Mail, User, Clock, Activity, Camera, RotateCw, Maximize2 } from "lucide-react";
import LiveMap from "@/components/LiveMap";
import { customerApi, trackingApi, type CustomerRecord, type TrackingUpdate } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { useRealtimeStatus } from "@/realtime/RealTimeListener";

export interface CustomerLocation {
  id: string;
  name: string;
  email: string;
  phone: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
  status: "active" | "inactive" | "moving";
  address: string;
}

const locationCoordinates: Record<string, { lat: number; lng: number; address: string }> = {
  Bhogapuram: { lat: 17.7445, lng: 83.2369, address: "Bhogapuram, Visakhapatnam" },
  Gajuwaka: { lat: 17.6868, lng: 83.2185, address: "Gajuwaka, Visakhapatnam" },
  Aganampudi: { lat: 17.7289, lng: 83.2506, address: "Aganampudi, Visakhapatnam" }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "moving":
      return "bg-blue-500";
    case "inactive":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "moving":
      return "Moving";
    case "inactive":
      return "Inactive";
    default:
      return "Unknown";
  }
};

const normalizeStatus = (status?: string) => {
  if (!status) return undefined;
  return status.toLowerCase() as "active" | "inactive" | "moving";
};

const View360 = ({ customer }: { customer: CustomerLocation | null }) => {
  const [rotation, setRotation] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isAutoRotating) {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 1) % 360);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isAutoRotating]);

  if (!customer) return null;

  const handleManualRotate = (direction: "left" | "right") => {
    setRotation((prev) => (direction === "left" ? (prev - 30 + 360) % 360 : (prev + 30) % 360));
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden backdrop-blur-md ${isFullscreen ? "fixed inset-0 z-50" : "h-96"}`}>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold">360 deg View - {customer.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-2 rounded-lg transition-colors ${
                isAutoRotating ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20"
              }`}
              title={isAutoRotating ? "Stop Rotation" : "Start Auto Rotation"}
            >
              <RotateCw className={`w-4 h-4 ${isAutoRotating ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-full bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64 transition-transform duration-300 ease-linear" style={{ transform: `rotateY(${rotation}deg)` }}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 opacity-20"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 opacity-30"></div>
            <div className="absolute inset-8 rounded-full bg-gradient-to-bl from-yellow-400 to-red-500 opacity-40"></div>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700">N</div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-700">S</div>
            <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 text-sm font-bold text-gray-700">W</div>
            <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 text-sm font-bold text-gray-700">E</div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/85 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          <button
            onClick={() => handleManualRotate("left")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Rotate Left"
          >
            <RotateCw className="w-4 h-4 rotate-180" />
          </button>
          <div className="text-sm font-medium text-slate-700">{rotation} deg</div>
          <button
            onClick={() => handleManualRotate("right")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Rotate Right"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute top-4 left-4 bg-white/85 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="text-xs font-medium text-slate-700">Current Location</div>
          <div className="text-sm font-bold text-slate-900">{customer.address}</div>
          <div className="text-xs text-slate-600">
            Lat: {customer.latitude.toFixed(4)}, Lng: {customer.longitude.toFixed(4)}
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-white/85 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(customer.status)}`}></div>
            <span className="text-sm font-medium text-slate-700">{getStatusText(customer.status)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerLiveTracking = () => {
  const [customers, setCustomers] = useState<CustomerLocation[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLocation | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "360">("map");
  const [hasLiveTracking, setHasLiveTracking] = useState(false);
  const { lastEvent } = useRealtimeStatus();

  const { data: customerResponse, isLoading } = useQuery({
    queryKey: ["tracking-customers"],
    queryFn: () => customerApi.list(1, 50)
  });

  const { data: trackingResponse } = useQuery({
    queryKey: ["tracking"],
    queryFn: trackingApi.list
  });

  const trackingUpdates = trackingResponse?.data ?? [];
  const trackingMap = useMemo(() => {
    return new Map(trackingUpdates.map((update: TrackingUpdate) => [update.customerId, update]));
  }, [trackingUpdates]);

  const baseCustomers = useMemo(() => {
    const records = customerResponse?.data ?? [];
    return records.map((record: CustomerRecord) => {
      const tracking = trackingMap.get(record.id);
      const normalizedStatus = normalizeStatus(tracking?.status as string | undefined);
      const coords = tracking
        ? {
            lat: tracking.latitude,
            lng: tracking.longitude,
            address: tracking.address || record.location
          }
        : (locationCoordinates[record.location] ?? {
            lat: 17.7,
            lng: 83.25,
            address: record.location
          });

      return {
        id: record.id,
        name: record.contactName,
        email: "",
        phone: record.contactNumber,
        latitude: coords.lat,
        longitude: coords.lng,
        lastUpdated: tracking?.updatedAt || new Date().toISOString(),
        status: normalizedStatus || (record.interested ? "active" : "inactive"),
        address: coords.address
      } as CustomerLocation;
    });
  }, [customerResponse, trackingMap]);

  useEffect(() => {
    setCustomers(baseCustomers);
  }, [baseCustomers]);

  useEffect(() => {
    if (baseCustomers.length === 0) return;
    if (hasLiveTracking || trackingUpdates.length > 0) return;

    const interval = setInterval(() => {
      setCustomers((prev) =>
        prev.map((customer) => ({
          ...customer,
          latitude: customer.latitude + (Math.random() - 0.5) * 0.001,
          longitude: customer.longitude + (Math.random() - 0.5) * 0.001,
          lastUpdated: new Date().toISOString(),
          status: Math.random() > 0.3 ? "active" : "moving"
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [baseCustomers.length, hasLiveTracking, trackingUpdates.length]);

  useEffect(() => {
    if (lastEvent?.type !== "tracking.updated") return;
    const payload = lastEvent.payload?.tracking ?? lastEvent.payload;
    if (!payload?.customerId) return;

    setHasLiveTracking(true);

    const normalizedStatus = normalizeStatus(payload.status);

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === payload.customerId
          ? {
              ...customer,
              latitude: payload.latitude ?? customer.latitude,
              longitude: payload.longitude ?? customer.longitude,
              status: normalizedStatus ?? customer.status,
              address: payload.address ?? customer.address,
              lastUpdated: payload.updatedAt ?? new Date().toISOString()
            }
          : customer
      )
    );

    setSelectedCustomer((prev) =>
      prev?.id === payload.customerId
        ? {
            ...prev,
            latitude: payload.latitude ?? prev.latitude,
            longitude: payload.longitude ?? prev.longitude,
            status: normalizedStatus ?? prev.status,
            address: payload.address ?? prev.address,
            lastUpdated: payload.updatedAt ?? new Date().toISOString()
          }
        : prev
    );
  }, [lastEvent]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-slate-600">Loading customer locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Customer Live Tracking</h1>
        <p className="text-muted-foreground">Real-time location tracking of all customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Active Customers</h2>

          {customers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => setSelectedCustomer(customer)}
              className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCustomer?.id === customer.id ? "border-blue-500 shadow-md" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{customer.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(customer.status)}`}></div>
                      <span className="text-xs text-slate-600">{getStatusText(customer.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600">{formatTime(customer.lastUpdated)}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{customer.email || "Email not provided"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{customer.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-6 h-full backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-card-foreground">{viewMode === "map" ? "Live Location Map" : "360 deg View"}</h2>
                {selectedCustomer && (
                  <div className="flex items-center gap-2 bg-white/70 rounded-lg p-1 border border-border">
                    <button
                      onClick={() => setViewMode("map")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("360")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        viewMode === "360" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>{hasLiveTracking || trackingUpdates.length > 0 ? "Live tracking active" : "Simulated updates every 5 seconds"}</span>
              </div>
            </div>

            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-700">{selectedCustomer.name}</h3>
                      <p className="text-sm text-blue-600">{selectedCustomer.address}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedCustomer.status)}`}>
                      {getStatusText(selectedCustomer.status)}
                    </div>
                  </div>
                </div>

                {viewMode === "map" ? <LiveMap customer={selectedCustomer} customers={customers} /> : <View360 customer={selectedCustomer} />}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-1">Latitude</p>
                    <p className="font-mono font-semibold text-card-foreground">{selectedCustomer.latitude.toFixed(6)}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-slate-600 mb-1">Longitude</p>
                    <p className="font-mono font-semibold text-card-foreground">{selectedCustomer.longitude.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Customer</h3>
                  <p className="text-gray-600">Choose a customer from the list to view their live location</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLiveTracking;
