import VentureLayoutEditor from "@/components/VentureLayoutEditor";

const LayoutEditorPage = () => {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Layout Editor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload venture layouts and map plot coordinates by drawing directly on the layout.
        </p>
      </div>
      <VentureLayoutEditor />
    </div>
  );
};

export default LayoutEditorPage;
