import { Suspense } from "react";
import { useLoaderData, useNavigation, LoaderFunctionArgs, Await } from "react-router-dom";
import { getCustomers, PagedCustomerResult } from "@/lib/Api/customerApi";
import CustomerTable from "@/components/ui/customerTable/CustomerTable";

export const customerLoader = async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") || "0", 10);
    const size = parseInt(url.searchParams.get("size") || "10", 10);

    const customerResult = await getCustomers({
        page,
        size,
        searchQuery: searchQuery || null,
    });

    return { customerResult };
};

const CustomersLoading = () => {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

const CustomersPage = () => {
    const { customerResult } = useLoaderData() as { customerResult: PagedCustomerResult };
    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    const totalElements = customerResult?.totalElements ?? 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Top Page Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Customers
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {totalElements} registered customer{totalElements === 1 ? "" : "s"}
                </p>
            </div>

            {/* Customer Table */}
            <Suspense fallback={<CustomersLoading />}>
                <Await resolve={customerResult}>
                    {(result: PagedCustomerResult) => (
                        <CustomerTable
                            customers={result?.content ?? []}
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
};

export default CustomersPage;
