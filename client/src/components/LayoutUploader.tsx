import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ventureApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function LayoutUploader() {
  const queryClient = useQueryClient();
  const [ventureId, setVentureId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["ventures"],
    queryFn: () => ventureApi.list()
  });

  const ventures = Array.isArray(data?.data) ? data.data : [];

  const upload = async () => {
    if (!ventureId || !file) {
      toast.error("Select a venture and an SVG file.");
      return;
    }

    setUploading(true);
    try {
      const response = await ventureApi.uploadLayout(ventureId, file);
      toast.success(response.message || "Layout uploaded");
      await queryClient.invalidateQueries({ queryKey: ["venture", ventureId] });
      setFile(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload layout");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Venture</Label>
        <Select value={ventureId} onValueChange={setVentureId}>
          <SelectTrigger>
            <SelectValue placeholder="Select venture" />
          </SelectTrigger>
          <SelectContent>
            {ventures.map((v: any) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>SVG layout file</Label>
        <Input type="file" accept=".svg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={upload} disabled={!ventureId || !file || uploading}>
          {uploading ? "Uploading..." : "Upload SVG"}
        </Button>
      </div>
    </div>
  );
}

