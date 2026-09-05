import { Suspense } from "react";
import OrdersTable from "@/components/ui/ordersTable/OrdersTable";
import { getFilteredOrders } from "@/lib/Api/orderApi";
import { Order } from "@/models/order";
import { Await, useLoaderData, useNavigation, LoaderFunctionArgs } from "react-router-dom";
 
export const orderLoader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const sortKey = url.searchParams.get("sortKey");
    const sortDir = url.searchParams.get("sortDir") as "asc" | "desc" | null;
    const searchQuery = url.searchParams.get("q");

    const [orderList] = await Promise.all([
        getFilteredOrders({
            status: status === "All" ? null : status?.toUpperCase(),
            page: 0,
            size: 9999,
            sortKey,
            sortDir,
            searchQuery: searchQuery || null,
        }),
    ]); 
    return { orderList };
};

const OrdersLoading = () => {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

const OrdersPage = () => {
    const { orderList } = useLoaderData() as { orderList: Order[] };
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
            <Suspense fallback={<OrdersLoading />}>
                <Await resolve={orderList}>
                    {(loadedOrders) => (
                        <OrdersTable orders={loadedOrders} isLoading={isLoading} />
                    )}
                </Await>
            </Suspense>
        </div>
    );
}
export default OrdersPage;