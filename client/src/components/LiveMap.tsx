import { Navigation, MapPin, Phone, Mail } from "lucide-react";
import { CustomerLocation } from "@/pages/CustomerLiveTracking";

interface Props {
  customer: CustomerLocation | null;
  customers: CustomerLocation[];
}

const LiveMap = ({ customer }: Props) => {
  const getStaticMapUrl = (lat: number, lng: number, zoom: number = 15) => {
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=800x400&markers=${lat},${lng},red`;
  };

  if (!customer) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Customer</h3>
          <p className="text-gray-600">Choose a customer from the list to view their live location</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-300">
      <img
        src={getStaticMapUrl(customer.latitude, customer.longitude)}
        alt="Map showing customer location"
        className="w-full h-full object-cover"
      />

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-blue-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {customer.name}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">Live Tracking</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm">{customer.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3" />
            <span>{customer.email || "Email not provided"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{customer.address}</span>
          </div>
          <div className="text-xs text-gray-500">
            Status: <span className={`font-medium ${customer.status === "active" ? "text-green-600" : customer.status === "moving" ? "text-blue-600" : "text-gray-600"}`}>{customer.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;