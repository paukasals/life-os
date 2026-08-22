import OrderButton from "@/components/OrderButton";
import { schedule } from "@/lib/locations-data";

export const metadata = {
  title: "Locations",
  description: "Find the Lobsteria Airstream — weekly schedule and stops.",
};

export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Find the truck</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Weekly schedule</h1>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Can&apos;t make it to a stop? Order online for pickup or delivery instead.
        </p>
        <div className="mt-6">
          <OrderButton size="lg" />
        </div>
      </div>

      <div className="mt-14 aspect-[16/7] w-full rounded-3xl bg-sand-dark" />

      <div className="mt-14 overflow-hidden rounded-2xl ring-1 ring-navy/10">
        <table className="w-full text-left">
          <thead className="bg-navy text-sand">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold">Day</th>
              <th className="px-6 py-3 text-sm font-semibold">Location</th>
              <th className="px-6 py-3 text-sm font-semibold">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10 bg-shell">
            {schedule.map((row) => (
              <tr key={row.day}>
                <td className="px-6 py-4 text-sm font-medium">{row.day}</td>
                <td className="px-6 py-4 text-sm text-navy/70">{row.stop}</td>
                <td className="px-6 py-4 text-sm text-navy/70">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-center text-sm text-navy/60">
        Schedule can shift for weather, private events, and catering. Follow us on Instagram for
        real-time location updates.
      </p>
    </div>
  );
}
