import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, AlertTriangle, Star, Zap } from 'lucide-react';
import { useItemDetails } from '@/app/hooks/use-item-details';
import { formatNumber } from '@/lib/utils';
import Image from 'next/image';
import { RobuxIcon } from '@/components/ui/robux-icon';

interface ItemDetailsProps {
    itemId: string | number;
}

export function ItemDetails({ itemId }: ItemDetailsProps) {
    const [itemDetails, setItemDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getItemDetails, getDemandText, getTrendText, isProjected, isHyped, isRare } = useItemDetails();

    useEffect(() => {
        // Reset state when itemId changes
        setIsLoading(true);
        setItemDetails(null);

        async function loadItemDetails() {
            try {
                const details = await getItemDetails(itemId);
                setItemDetails(details);
            } catch (error) {
                console.error(`Failed to load details for item ${itemId}:`, error);
            } finally {
                setIsLoading(false);
            }
        }

        loadItemDetails();
    }, [itemId, getItemDetails]);

    if (isLoading) {
        return (
            <div className="flex flex-col space-y-2 w-full">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        );
    }

    if (!itemDetails) {
        return (
            <div className="text-zinc-500 text-xs">
                No value data available
            </div>
        );
    }

    // Get text representations
    const demandText = getDemandText(itemDetails.demand);
    const trendText = getTrendText(itemDetails.trend);

    // Check statuses
    const isItemProjected = isProjected(itemDetails.projected);
    const isItemHyped = isHyped(itemDetails.hyped);
    const isItemRare = isRare(itemDetails.rare);

    // Determine value color - compare value to RAP
    const valueColor = itemDetails.value > itemDetails.rap
        ? "text-green-500"
        : itemDetails.value < itemDetails.rap
            ? "text-red-500"
            : "text-zinc-300";

    const getDemandColor = (demand: string) => {
        const colors: Record<string, string> = {
            'None': 'bg-zinc-700',
            'Terrible': 'bg-red-900',
            'Low': 'bg-orange-900',
            'Normal': 'bg-blue-900',
            'High': 'bg-green-900',
            'Amazing': 'bg-purple-900'
        };
        return colors[demand] || 'bg-zinc-700';
    };

    const getTrendColor = (trend: string) => {
        const colors: Record<string, string> = {
            'None': 'bg-zinc-700',
            'Lowering': 'bg-red-900',
            'Unstable': 'bg-orange-900',
            'Stable': 'bg-blue-900',
            'Raising': 'bg-green-900',
            'Fluctuating': 'bg-purple-900'
        };
        return colors[trend] || 'bg-zinc-700';
    };

    const getTrendIcon = (trend: string) => {
        if (trend === 'Raising') return <TrendingUp className="h-3 w-3" />;
        if (trend === 'Lowering') return <TrendingDown className="h-3 w-3" />;
        return null;
    };

    return (
        <div className="flex flex-col text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* Check if value is not defined or -1 */}
                {(itemDetails.value === undefined || itemDetails.value === -1) ? (
                    /* RAP display when no value */
                    <div className="font-semibold text-zinc-300 flex items-center gap-1">
                        <RobuxIcon className="h-4 w-4 text-zinc-300" />
                        {formatNumber(itemDetails.rap)}
                    </div>
                ) : (
                    <>
                        {/* Value display when value exists */}
                        <div className="font-semibold text-blue-500 flex items-center gap-1">
                            <Image
                                src="/icons/rolimons_logo_icon_blue.png"
                                alt="Rolimons"
                                width={16}
                                height={16}
                                className="object-contain"
                            />
                            {formatNumber(itemDetails.value)}
                        </div>
                        
                        {/* Show RAP as secondary if different from value */}
                        {itemDetails.rap !== itemDetails.value && (
                            <div className="font-semibold text-zinc-300 flex items-center gap-1">
                                <RobuxIcon className="h-4 w-4 text-zinc-300" /> {formatNumber(itemDetails.rap)}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-1.5">
                {/* Demand Badge */}
                <Badge
                    variant="outline"
                    className={`px-1.5 py-0 h-4 ${getDemandColor(demandText)} border-none text-[10px]`}
                >
                    D: {demandText}
                </Badge>

                {/* Trend Badge */}
                <Badge
                    variant="outline"
                    className={`px-1.5 py-0 h-4 ${getTrendColor(trendText)} border-none text-[10px] flex items-center gap-0.5`}
                >
                    {getTrendIcon(trendText)}
                    {trendText}
                </Badge>

                {/* Projected Badge */}
                {isItemProjected && (
                    <Badge
                        variant="outline"
                        className="px-1.5 py-0 h-4 bg-red-700 text-white border-none text-[10px] flex items-center gap-0.5"
                    >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Proj
                    </Badge>
                )}

                {/* Hyped Badge */}
                {isItemHyped && (
                    <Badge
                        variant="outline"
                        className="px-1.5 py-0 h-4 bg-amber-800 text-white border-none text-[10px] flex items-center gap-0.5"
                    >
                        <Zap className="h-2.5 w-2.5" />
                        Hyped
                    </Badge>
                )}

                {/* Rare Badge */}
                {isItemRare && (
                    <Badge
                        variant="outline"
                        className="px-1.5 py-0 h-4 bg-purple-800 text-white border-none text-[10px] flex items-center gap-0.5"
                    >
                        <Star className="h-2.5 w-2.5" />
                        Rare
                    </Badge>
                )}
            </div>
        </div>
    );
} 