import { IdRoute } from "../../../features/inventory/screens";
import { LayoutScreen } from "../../../features/inventory/layout";
export default function Route() { return <IdRoute>{id => <LayoutScreen id={id} />}</IdRoute>; }
