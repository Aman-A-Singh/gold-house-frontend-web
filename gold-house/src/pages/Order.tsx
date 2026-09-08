import { Suspense } from "react";
import OrdersTable from "@/components/ui/ordersTable/OrdersTable";
import { getFilteredOrders, PagedOrderResult } from "@/lib/Api/orderApi";
import { Await, useLoaderData, useNavigation, LoaderFunctionArgs } from "react-router-dom";

export const orderLoader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const sortKey = url.searchParams.get("sortKey");
    const sortDir = url.searchParams.get("sortDir") as "asc" | "desc" | null;
    const searchQuery = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const size = parseInt(url.searchParams.get("size") || "10", 10);

    const orderResult = await getFilteredOrders({
        status: status === "All" ? null : status?.toUpperCase(),
        page,
        size,
        sortKey,
        sortDir,
        searchQuery: searchQuery || null,
    });

    return { orderResult };
};

const OrdersLoading = () => {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

const OrdersPage = () => {
    const { orderResult } = useLoaderData() as { orderResult: PagedOrderResult };
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
            <Suspense fallback={<OrdersLoading />}>
                <Await resolve={orderResult}>
                    {(result: PagedOrderResult) => (
                        <OrdersTable
                            orders={result?.content ?? []}
                            pagination={{
                                pageNumber: result?.pageNumber ?? 0,
                                pageSize: result?.pageSize ?? 10,
                                totalElements: result?.totalElements ?? 0,
                                totalPages: result?.totalPages ?? 0,
                            }}
                            isLoading={isLoading}
                        />
                    )}
                </Await>
            </Suspense>
        </div>
    );
}
export default OrdersPage;