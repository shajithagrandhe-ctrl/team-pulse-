import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ventureApi, type Venture } from "@/services/api";

const NewVenture = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [plotCount, setPlotCount] = useState(50);
  const [plotNumberPrefix, setPlotNumberPrefix] = useState("Plot ");
  const [startingPlotNumber, setStartingPlotNumber] = useState(1);
  const [defaultArea, setDefaultArea] = useState(100);
  const [defaultPricePerSqYard, setDefaultPricePerSqYard] = useState(10000);

  const [createdVenture, setCreatedVenture] = useState<Venture | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [uploadingLayout, setUploadingLayout] = useState(false);

  const canCreate = useMemo(() => {
    return Boolean(name.trim()) && Boolean(locationName.trim()) && plotCount > 0 && defaultArea > 0 && defaultPricePerSqYard > 0;
  }, [name, locationName, plotCount, defaultArea, defaultPricePerSqYard]);

  const createMutation = useMutation({
    mutationFn: () =>
      ventureApi.create({
        name: name.trim(),
        locationName: locationName.trim(),
        plotCount,
        plotNumberPrefix: plotNumberPrefix.trim() ? plotNumberPrefix : undefined,
        startingPlotNumber,
        defaultArea,
        defaultPricePerSqYard
      }),
    onSuccess: async (response) => {
      let created = response.data;
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          const photoResponse = await ventureApi.uploadPhoto(created.id, photoFile);
          created = photoResponse.data;
          toast.success("Venture created and photo uploaded");
        } catch (error: any) {
          toast.error(error?.message || "Venture created, but photo upload failed");
        } finally {
          setUploadingPhoto(false);
        }
      } else {
        toast.success(response.message || "Venture created");
      }
      setCreatedVenture(created);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create venture");
    }
  });

  const uploadLayout = async () => {
    if (!createdVenture || !layoutFile) return;
    setUploadingLayout(true);
    try {
      const response = await ventureApi.uploadLayout(createdVenture.id, layoutFile);
      toast.success(response.message || "Layout uploaded");
      setLayoutFile(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload layout");
    } finally {
      setUploadingLayout(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Venture</CardTitle>
          <CardDescription>Create a venture and auto-generate plots so you can upload a layout and map coordinates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Venture name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Valley Phase 1" />
          </div>

          <div className="space-y-2">
            <Label>Location (type manually)</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Bhogapuram"
            />
          </div>

          <div className="space-y-2">
            <Label>Venture photo</Label>
            <Input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setPhotoFile(file);
                if (file) {
                  setPhotoPreview(URL.createObjectURL(file));
                } else {
                  setPhotoPreview("");
                }
              }}
            />
            {photoPreview && (
              <div className="overflow-hidden rounded-md border">
                <img src={photoPreview} alt="Venture preview" className="h-44 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of plots</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={plotCount}
                onChange={(e) => setPlotCount(Number(e.target.value || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label>Plot number prefix</Label>
              <Input value={plotNumberPrefix} onChange={(e) => setPlotNumberPrefix(e.target.value)} placeholder="Plot " />
            </div>
            <div className="space-y-2">
              <Label>Starting plot number</Label>
              <Input
                type="number"
                min={1}
                value={startingPlotNumber}
                onChange={(e) => setStartingPlotNumber(Number(e.target.value || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label>Default area</Label>
              <Input type="number" min={1} value={defaultArea} onChange={(e) => setDefaultArea(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Default price per sq yard</Label>
              <Input
                type="number"
                min={1}
                value={defaultPricePerSqYard}
                onChange={(e) => setDefaultPricePerSqYard(Number(e.target.value || 0))}
              />
            </div>
          </div>

          <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending || uploadingPhoto}>
            {createMutation.isPending || uploadingPhoto ? "Creating..." : "Create Venture"}
          </Button>
        </CardContent>
      </Card>

      {createdVenture && (
        <Card>
          <CardHeader>
            <CardTitle>Next: Upload Layout</CardTitle>
            <CardDescription>
              Venture created: <span className="font-medium">{createdVenture.name}</span>. Upload a layout (PDF/PNG/JPG), then open the Layout Editor
              to map plots for this venture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Layout file (PDF/PNG/JPG)</Label>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setLayoutFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-3">
              <Button onClick={uploadLayout} disabled={!layoutFile || uploadingLayout}>
                {uploadingLayout ? "Uploading..." : "Upload Layout"}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/layout-editor?ventureId=${createdVenture.id}`)}>
                Open Layout Editor
              </Button>
              <Button variant="outline" onClick={() => navigate(`/ventures/${createdVenture.locationId}/${createdVenture.id}`)}>
                View Venture
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewVenture;
