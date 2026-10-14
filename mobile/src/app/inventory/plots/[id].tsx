import { PlotDetail, IdRoute } from "../../../features/inventory/screens";
export default function Route() { return <IdRoute>{id => <PlotDetail id={id} />}</IdRoute>; }
