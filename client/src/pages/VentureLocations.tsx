import { MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { locationApi } from "@/services/api";

const VentureLocations = () => {
  const navigate = useNavigate();
  const { data: locationsResponse, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: locationApi.list
  });

  const locations = locationsResponse?.data ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Venture Locations</h1>
        <p className="text-muted-foreground text-sm mt-1">Click a location to view ventures in that location.</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc, idx) => {
            const totalPlots = loc.ventures.reduce((sum, v) => sum + v.plotCount, 0);
            const available = loc.availablePlots ?? 0;
            const sold = loc.ventures.reduce((sum, v) => sum + (v.soldPlots ?? 0), 0);
            const previewImage = loc.ventures.find((venture) => venture.photoUrl)?.photoUrl ?? null;
            return (
              <button
                key={loc.id}
                onClick={() => navigate(`/ventures/${loc.id}`)}
                className="overflow-hidden bg-card rounded-xl border border-border hover:shadow-lg transition-all text-left group"
              >
                <div className="h-32 w-full bg-muted">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={`${loc.name} location preview`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800/80 to-slate-600/70 text-primary-foreground">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {String.fromCharCode(65 + idx)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground text-lg">{loc.name}</h3>
                      <p className="text-sm text-slate-600">{loc.ventures.length} ventures</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Total: {totalPlots} | Available: {available} | Sold: {sold}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VentureLocations;
