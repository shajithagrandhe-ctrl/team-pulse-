import { VentureDetail, IdRoute } from "../../../features/inventory/screens";
export default function Route() { return <IdRoute>{id => <VentureDetail id={id} />}</IdRoute>; }
