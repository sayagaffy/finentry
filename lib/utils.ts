import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Mengabungkan class names secara dinamis menggunakan clsx dan tailwind-merge.
 * Berguna untuk kondisi styling yang kondisional.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format angka menjadi format mata uang Rupiah (IDR).
 * Contoh: 10000 -> Rp 10.000
 */
export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format tanggal menjadi format Indonesia standar.
 * Contoh: 17 Agustus 2024
 */
export function formatDate(date: Date | string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
    }).format(new Date(date));
}
