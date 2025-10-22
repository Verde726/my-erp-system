import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Product } from "@/models"

// Example hook for fetching products
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      return response.json() as Promise<Product[]>
    },
  })
}

// Example hook for creating a product
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      })
      if (!response.ok) {
        throw new Error("Failed to create product")
      }
      return response.json() as Promise<Product>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}
