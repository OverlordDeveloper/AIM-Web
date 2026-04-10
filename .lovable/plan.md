

## Analytics Page

### Overview
Add a new "Analytics" page accessible from the top navigation bar. The page will fetch historical inspection data from the existing backend API and display various charts showing defect/detection trends over time.

### What gets built

1. **New route and nav link** -- Add `/analytics` route in `App.tsx` and a "Analytics" link (with `BarChart3` icon) in `TopNav.tsx`.

2. **Analytics page (`src/pages/Analytics.tsx`)** -- Full-page layout with:
   - Top nav (reusing existing `TopNav` component)
   - Time range selector (Last 7 days, Last 30 days, Custom range)
   - Dashboard grid of chart cards

3. **Chart cards** (using existing Recharts + `ChartContainer` from `src/components/ui/chart.tsx`):
   - **Detections Over Time** -- Bar chart showing total inspections per day/week
   - **Defect Rate Trend** -- Line chart showing anomaly reject % and YOLO reject % over time
   - **Defects by Type** -- Pie/donut chart comparing anomaly vs YOLO rejects
   - **Hourly Distribution** -- Bar chart showing which hours have the most defects
   - **Summary Stats** -- Cards showing total inspections, total defects, defect rate %, pass rate %

4. **Data fetching** -- Use the existing `API_BASE` (`http://192.168.1.156:18080`) to fetch history records, then aggregate client-side into daily/weekly buckets for charting. Will use `@tanstack/react-query` for data fetching.

### Files to create/modify
- `src/pages/Analytics.tsx` -- New page component
- `src/components/TopNav.tsx` -- Add analytics nav link
- `src/App.tsx` -- Add `/analytics` route

### Technical notes
- Reuses the same `HistoryRecord` interface and API endpoint from the History page
- All chart components use the existing Recharts setup and `ChartContainer`/`ChartTooltip` from `src/components/ui/chart.tsx`
- Consistent dark theme styling matching existing pages

