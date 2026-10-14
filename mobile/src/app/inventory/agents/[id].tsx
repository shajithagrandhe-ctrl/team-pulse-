import { Agents, IdRoute } from "../../../features/inventory/screens";
export default function Route() { return <IdRoute>{id => <Agents id={id} />}</IdRoute>; }
