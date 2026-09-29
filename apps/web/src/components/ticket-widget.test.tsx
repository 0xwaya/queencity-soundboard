import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadTicketWidget() {
  vi.resetModules();
  return (await import("@/components/ticket-widget")).default;
}

describe("TicketWidget", () => {
  it("does not render links for unsupported provider URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    const TicketWidget = await loadTicketWidget();
    render(<TicketWidget eventTitle="Test Concert" eventTicketUrl="https://tickets.example.com/e/123" />);

    expect(screen.queryByRole("link", { name: "Buy Tickets" })).not.toBeInTheDocument();
  });

  it("does not render a direct link when no affiliate template is configured", async () => {
    const TicketWidget = await loadTicketWidget();
    render(<TicketWidget eventTitle="Test Concert" eventTicketUrl="https://www.ticketmaster.com/event/abc123" />);

    expect(screen.queryByRole("link", { name: "Buy Tickets" })).not.toBeInTheDocument();
    expect(screen.getByText(/Affiliate ticket link is not available yet/i)).toBeInTheDocument();
  });

  it("uses the affiliate URL for supported provider tickets", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    const TicketWidget = await loadTicketWidget();
    render(<TicketWidget eventTitle="Test Concert" eventTicketUrl="https://www.ticketmaster.com/event/abc123" />);

    expect(screen.getByRole("link", { name: "Buy Tickets" })).toHaveAttribute(
      "href",
      `https://track.example.com/?u=${encodeURIComponent("https://www.ticketmaster.com/event/abc123")}`,
    );
  });

  it("hides checkout when sales are disabled", async () => {
    const TicketWidget = await loadTicketWidget();
    render(
      <TicketWidget
        eventTitle="Paused Concert"
        eventTicketUrl="https://tickets.example.com/e/123"
        salesDisabled
      />,
    );

    expect(screen.queryByRole("link", { name: "Buy Tickets" })).not.toBeInTheDocument();
    expect(screen.getByText(/Ticket sales are paused/i)).toBeInTheDocument();
  });

  it("does not render checkout for non-HTTPS event URL", async () => {
    const TicketWidget = await loadTicketWidget();
    render(<TicketWidget eventTitle="Test Concert" eventTicketUrl="http://tickets.example.com/e/123" />);

    expect(screen.queryByRole("link", { name: "Buy Tickets" })).not.toBeInTheDocument();
    expect(screen.getByText(/Affiliate ticket link is not available yet/i)).toBeInTheDocument();
  });

  it("does not use the global checkout URL for an event without its own ticket URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_TICKETING_WIDGET_URL", "https://tickets.example.com/general");
    const TicketWidget = await loadTicketWidget();

    render(<TicketWidget eventTitle="Event Without Its Own Link" />);

    expect(screen.queryByRole("link", { name: "Buy Tickets" })).not.toBeInTheDocument();
    expect(screen.getByText(/Affiliate ticket link is not available yet/i)).toBeInTheDocument();
  });

  it("tracks checkout clicks", async () => {
    const { track } = await import("@vercel/analytics");
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_TEMPLATE_TICKETMASTER", "https://track.example.com/?u={url}");
    const TicketWidget = await loadTicketWidget();

    render(<TicketWidget eventTitle="Tracked Concert" eventTicketUrl="https://www.ticketmaster.com/event/abc123" />);
    fireEvent.click(screen.getByRole("link", { name: "Buy Tickets" }));

    expect(track).toHaveBeenCalledTimes(1);
  });
});
