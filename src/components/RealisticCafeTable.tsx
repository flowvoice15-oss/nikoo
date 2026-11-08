import React from 'react';
import { CafeTable, TableStatus } from '../types/cafe';

interface RealisticCafeTableProps {
  table: CafeTable;
  isSelected: boolean;
  isDragged?: boolean;
  isEditMode: boolean;
  onClick: () => void;
}

export const RealisticCafeTable: React.FC<RealisticCafeTableProps> = ({
  table,
  isSelected,
  isDragged,
  isEditMode,
  onClick,
}) => {
  const isOccupied = table.status === 'occupied';
  const isKitchen = table.status === 'kitchen_pending';
  const isReady = table.status === 'ready_to_serve';
  const isReserved = table.status === 'reserved';
  const isEmpty = table.status === 'empty';

  // Status visual cues
  let statusGlow = 'rgba(16, 185, 129, 0.25)'; // empty: emerald
  let statusBadgeBg = 'bg-emerald-600 text-white';
  let statusBadgeText = 'خالی';
  let tableWood = 'from-[#B88654] via-[#9E6E3D] to-[#7D532B]'; // natural warm oak
  let woodBorder = '#6A4423';

  if (isOccupied) {
    statusGlow = 'rgba(190, 24, 93, 0.35)';
    statusBadgeBg = 'bg-[#C84B31] text-white';
    statusBadgeText = 'اشغال شده';
    tableWood = 'from-[#A87442] via-[#8C5D30] to-[#6E4620]';
  } else if (isKitchen) {
    statusGlow = 'rgba(245, 158, 11, 0.4)';
    statusBadgeBg = 'bg-amber-600 text-white animate-pulse';
    statusBadgeText = 'در آشپزخانه';
    tableWood = 'from-[#B5824C] via-[#996A36] to-[#7A5023]';
  } else if (isReady) {
    statusGlow = 'rgba(14, 165, 233, 0.45)';
    statusBadgeBg = 'bg-sky-600 text-white animate-bounce';
    statusBadgeText = 'آماده سرو';
    tableWood = 'from-[#BA8956] via-[#A0703D] to-[#80552B]';
  } else if (isReserved) {
    statusGlow = 'rgba(147, 51, 234, 0.35)';
    statusBadgeBg = 'bg-purple-700 text-white';
    statusBadgeText = 'رزرو شده';
    tableWood = 'from-[#8E5B32] via-[#754722] to-[#5C3415]'; // deep walnut for VIP/reserve
  }

  // Elapsed time for occupied tables
  const elapsedMins = table.occupiedSince
    ? Math.max(1, Math.round((Date.now() - new Date(table.occupiedSince).getTime()) / 60000))
    : null;

  // Render Chairs around the table
  const renderChairs = () => {
    if (table.seats === 2) {
      // 2 chairs on left & right
      return (
        <>
          {/* Left Chair */}
          <div className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 w-3 sm:w-5 h-5 sm:h-7 flex items-center justify-center pointer-events-none">
            <div className="w-2.5 sm:w-4 h-4 sm:h-6 rounded-l-md bg-[#613E22] border border-[#442813] shadow-xs flex items-center justify-center">
              <div className="w-1.5 sm:w-2.5 h-3 sm:h-4.5 rounded-l-sm bg-[#8A5B35] border-r border-[#442813]/40" />
            </div>
          </div>
          {/* Right Chair */}
          <div className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 w-3 sm:w-5 h-5 sm:h-7 flex items-center justify-center pointer-events-none">
            <div className="w-2.5 sm:w-4 h-4 sm:h-6 rounded-r-md bg-[#613E22] border border-[#442813] shadow-xs flex items-center justify-center">
              <div className="w-1.5 sm:w-2.5 h-3 sm:h-4.5 rounded-r-sm bg-[#8A5B35] border-l border-[#442813]/40" />
            </div>
          </div>
        </>
      );
    }

    if (table.seats === 4) {
      if (table.shape === 'circle') {
        // 4 chairs angled
        return (
          <>
            <div className="absolute -top-2 sm:-top-3.5 left-1/2 -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
              <div className="w-3 sm:w-5 h-1.5 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
            </div>
            <div className="absolute -bottom-2 sm:-bottom-3.5 left-1/2 -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
              <div className="w-3 sm:w-5 h-1.5 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
            </div>
            <div className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 w-2.5 sm:w-4 h-4 sm:h-7 rounded-l-md bg-[#613E22] border border-[#442813] flex items-center">
              <div className="w-1.5 sm:w-2.5 h-3 sm:h-5 rounded-l-sm bg-[#8A5B35]" />
            </div>
            <div className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 w-2.5 sm:w-4 h-4 sm:h-7 rounded-r-md bg-[#613E22] border border-[#442813] flex items-center justify-end">
              <div className="w-1.5 sm:w-2.5 h-3 sm:h-5 rounded-r-sm bg-[#8A5B35]" />
            </div>
          </>
        );
      }

      // 4 chairs top and bottom
      return (
        <>
          {/* Top 2 Chairs */}
          <div className="absolute -top-2 sm:-top-3.5 left-1/4 -translate-x-1/2 w-3.5 sm:w-6 h-2.5 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
            <div className="w-2.5 sm:w-4.5 h-1.5 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -top-2 sm:-top-3.5 right-1/4 translate-x-1/2 w-3.5 sm:w-6 h-2.5 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
            <div className="w-2.5 sm:w-4.5 h-1.5 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
          </div>
          {/* Bottom 2 Chairs */}
          <div className="absolute -bottom-2 sm:-bottom-3.5 left-1/4 -translate-x-1/2 w-3.5 sm:w-6 h-2.5 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
            <div className="w-2.5 sm:w-4.5 h-1.5 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -bottom-2 sm:-bottom-3.5 right-1/4 translate-x-1/2 w-3.5 sm:w-6 h-2.5 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
            <div className="w-2.5 sm:w-4.5 h-1.5 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
          </div>
        </>
      );
    }

    if (table.seats === 6) {
      // 3 chairs top, 3 chairs bottom
      return (
        <>
          {/* Top 3 */}
          <div className="absolute -top-2 sm:-top-3.5 left-[20%] -translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -top-2 sm:-top-3.5 left-1/2 -translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -top-2 sm:-top-3.5 right-[20%] translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-t-md bg-[#613E22] border border-[#442813] flex justify-center">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-t-sm bg-[#8A5B35]" />
          </div>
          {/* Bottom 3 */}
          <div className="absolute -bottom-2 sm:-bottom-3.5 left-[20%] -translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -bottom-2 sm:-bottom-3.5 left-1/2 -translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
          </div>
          <div className="absolute -bottom-2 sm:-bottom-3.5 right-[20%] translate-x-1/2 w-3 sm:w-6 h-2 sm:h-4 rounded-b-md bg-[#613E22] border border-[#442813] flex justify-center items-end">
            <div className="w-2 sm:w-4.5 h-1 sm:h-2.5 rounded-b-sm bg-[#8A5B35]" />
          </div>
        </>
      );
    }

    // 8-seat VIP Table: 3 top, 3 bottom, 1 left head, 1 right head
    return (
      <>
        {/* Top 3 */}
        <div className="absolute -top-2.5 sm:-top-4 left-[22%] -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-t-lg bg-[#442813] border border-[#2E1A0B] flex justify-center">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-t-md bg-[#2C1810]" />
        </div>
        <div className="absolute -top-2.5 sm:-top-4 left-1/2 -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-t-lg bg-[#442813] border border-[#2E1A0B] flex justify-center">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-t-md bg-[#2C1810]" />
        </div>
        <div className="absolute -top-2.5 sm:-top-4 right-[22%] translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-t-lg bg-[#442813] border border-[#2E1A0B] flex justify-center">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-t-md bg-[#2C1810]" />
        </div>
        {/* Bottom 3 */}
        <div className="absolute -bottom-2.5 sm:-bottom-4 left-[22%] -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-b-lg bg-[#442813] border border-[#2E1A0B] flex justify-center items-end">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-b-md bg-[#2C1810]" />
        </div>
        <div className="absolute -bottom-2.5 sm:-bottom-4 left-1/2 -translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-b-lg bg-[#442813] border border-[#2E1A0B] flex justify-center items-end">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-b-md bg-[#2C1810]" />
        </div>
        <div className="absolute -bottom-2.5 sm:-bottom-4 right-[22%] translate-x-1/2 w-4 sm:w-7 h-2.5 sm:h-4.5 rounded-b-lg bg-[#442813] border border-[#2E1A0B] flex justify-center items-end">
          <div className="w-3 sm:w-5 h-1.5 sm:h-3 rounded-b-md bg-[#2C1810]" />
        </div>
        {/* Left Head */}
        <div className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 w-2.5 sm:w-4.5 h-4 sm:h-7 rounded-l-lg bg-[#442813] border border-[#2E1A0B] flex items-center">
          <div className="w-1.5 sm:w-3 h-3 sm:h-5 rounded-l-md bg-[#2C1810]" />
        </div>
        {/* Right Head */}
        <div className="absolute -right-2.5 sm:-right-4 top-1/2 -translate-y-1/2 w-2.5 sm:w-4.5 h-4 sm:h-7 rounded-r-lg bg-[#442813] border border-[#2E1A0B] flex items-center justify-end">
          <div className="w-1.5 sm:w-3 h-3 sm:h-5 rounded-r-md bg-[#2C1810]" />
        </div>
      </>
    );
  };

  // Responsive Dimensions: compact on mobile so tables don't crowd, spacious on laptop
  let tableWidthClass = 'w-15 sm:w-26';
  let tableHeightClass = 'h-14 sm:h-24';
  let shapeClass = 'rounded-xl sm:rounded-2xl';

  if (table.shape === 'circle') {
    shapeClass = 'rounded-full aspect-square';
    tableWidthClass = table.seats === 2 ? 'w-12 sm:w-20' : 'w-14 sm:w-24';
    tableHeightClass = table.seats === 2 ? 'h-12 sm:h-20' : 'h-14 sm:h-24';
  } else if (table.shape === 'rectangle' || table.seats >= 6) {
    shapeClass = 'rounded-xl sm:rounded-2xl';
    tableWidthClass = table.seats >= 8 ? 'w-26 sm:w-48' : 'w-20 sm:w-36';
    tableHeightClass = 'h-14 sm:h-24';
  }

  return (
    <div
      onClick={onClick}
      style={{
        top: `${table.posY}%`,
        left: `${table.posX}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className={`absolute z-10 cursor-pointer select-none transition-all duration-200 group ${
        isSelected ? 'scale-108 z-20' : 'hover:scale-104'
      } ${isDragged ? 'ring-4 ring-amber-500 scale-110 z-30' : ''}`}
    >
      {/* Furniture Container with Floor Shadow */}
      <div
        className="relative flex items-center justify-center p-1 sm:p-2"
        style={{
          filter: `drop-shadow(0 6px 10px ${statusGlow}) drop-shadow(0 2px 4px rgba(44, 24, 16, 0.25))`,
        }}
      >
        {/* Realistic Chairs */}
        {renderChairs()}

        {/* Real Wooden Table Top */}
        <div
          className={`relative ${shapeClass} ${tableWidthClass} ${tableHeightClass} bg-gradient-to-br ${tableWood} border-2 border-[${woodBorder}] flex flex-col items-center justify-between p-1 sm:p-2 shadow-inner overflow-hidden transition-all`}
          style={{
            boxShadow: `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.25)`,
          }}
        >
          {/* Subtle Wood Plank Grooves (for rectangular/square tables) */}
          {table.shape !== 'circle' && (
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-around">
              <div className="w-full h-px bg-black" />
              <div className="w-full h-px bg-white/40" />
              <div className="w-full h-px bg-black" />
            </div>
          )}

          {/* Brass Table Rim (for round tables) */}
          {table.shape === 'circle' && (
            <div className="absolute inset-0.5 sm:inset-1 rounded-full border border-[#D4AF37]/40 pointer-events-none" />
          )}

          {/* Top Bar on Table: Status Pill */}
          <div className="w-full flex items-center justify-between z-10 pointer-events-none px-0.5">
            <span className={`text-[7px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0 sm:py-0.2 rounded-full shadow-2xs ${statusBadgeBg}`}>
              {statusBadgeText}
            </span>

            {/* Seat Count Icon */}
            <span className="text-[7px] sm:text-[9px] font-mono tabular-nums text-white/90 drop-shadow-xs font-bold">
              {table.seats}ن
            </span>
          </div>

          {/* Centerpiece & Table Number Medallion */}
          <div className="flex flex-col items-center justify-center z-10 pointer-events-none my-auto">
            {/* Table Number Brass Plaque */}
            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#FFF5E6] to-[#E5CCA0] border border-[#8C6239] shadow-xs flex items-center justify-center">
              <span className="font-mono text-[10px] sm:text-sm font-black text-[#3D2110] leading-none">
                {table.number}
              </span>
            </div>

            {/* Tabletop Items: Coffee Cups / Flower Vase */}
            <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 scale-70 sm:scale-100 origin-center">
              {/* Center Tiny Flower Vase / Candle */}
              <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-700/80 border border-emerald-900 shadow-2xs flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-amber-300" />
              </div>

              {/* Coffee Cups on Table if occupied or ready */}
              {(isOccupied || isKitchen || isReady) && (
                <div className="flex items-center gap-0.5 sm:gap-1 animate-pulse">
                  {/* Cup 1 */}
                  <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white border border-[#8C6239] shadow-2xs flex items-center justify-center">
                    <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#3D2110]" />
                  </div>
                  {table.seats >= 4 && (
                    /* Cup 2 */
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white border border-[#8C6239] shadow-2xs flex items-center justify-center">
                      <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-[#3D2110]" />
                    </div>
                  )}
                </div>
              )}

              {/* Reserved brass sign */}
              {isReserved && (
                <span className="text-[7px] sm:text-[8px] font-bold text-[#E5CCA0] bg-[#3D2110] px-1 rounded shadow-2xs">
                  رزرو
                </span>
              )}
            </div>
          </div>

          {/* Bottom Table Bar: Waiter or Elapsed Time */}
          <div className="w-full flex items-center justify-center z-10 pointer-events-none">
            {elapsedMins ? (
              <span className="text-[7px] sm:text-[9px] font-mono tabular-nums font-bold text-white bg-black/55 backdrop-blur-xs px-1 sm:px-1.5 py-0 sm:py-0.2 rounded-md">
                {elapsedMins}د
              </span>
            ) : (
              <span className="text-[7px] sm:text-[9px] text-white/80 font-medium truncate max-w-[50px] sm:max-w-[80px]">
                {table.label}
              </span>
            )}
          </div>
        </div>

        {/* Selection Ring */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-white ring-2 ring-[#4A2E1B] pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
};
