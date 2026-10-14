import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DraftingCompass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { locationApi, type Venture, ventureApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const VenturesList = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEditLayouts = user?.role !== "CUSTOMER";

  const { data: locationResponse, isLoading } = useQuery({
    queryKey: ["location", locationId],
    queryFn: () => locationApi.get(locationId || "")
  });

  const location = locationResponse?.data;

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading ventures...</div>;
  }

  if (!location) return <div className="p-8 text-muted-foreground">Location not found</div>;

  const ventures = (location.ventures || []) as Venture[];

  return (
    <div className="p-8 space-y-6">
      <button onClick={() => navigate("/ventures")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Locations
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{location.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{ventures.length} ventures available</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ventures.map((venture) => {
          const plots = venture.plots || [];
          const available = plots.filter((p) => p.status === "AVAILABLE").length;
          const sold = plots.filter((p) => p.status === "SOLD").length;
          const total = plots.length;
          const ventureImage = venture.photoUrl || venture.layoutImage || "";
          return (
            <div
              key={venture.id}
              className="overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:shadow-lg"
            >
              <button
                type="button"
                onClick={() => navigate(`/ventures/${locationId}/${venture.id}`)}
                className="block h-40 w-full bg-muted"
              >
                {ventureImage ? (
                  <img src={ventureApi.getAssetUrl(ventureImage)} alt={`${venture.name} preview`} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">No venture photo</div>
                )}
              </button>
              <div className="p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-600">{location.name}</p>
                <h3 className="font-semibold text-card-foreground text-lg">{venture.name}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-plot-available" />Available: {available}</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-plot-sold" />Sold: {sold}</span>
                  <span className="font-medium">Total: {total}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/ventures/${locationId}/${venture.id}`)}
                    className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    View Plots
                  </button>
                  {canEditLayouts && (
                    <button
                      type="button"
                      onClick={() => navigate(`/layout-editor?ventureId=${venture.id}`)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium text-card-foreground transition hover:bg-muted"
                    >
                      <DraftingCompass className="w-3.5 h-3.5" />
                      {venture.layoutImage ? "Edit Layout" : "Map Layout"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VenturesList;
