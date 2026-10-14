import { Locations, IdRoute } from "../../../features/inventory/screens";
export default function Route() { return <IdRoute>{id => <Locations id={id} />}</IdRoute>; }
