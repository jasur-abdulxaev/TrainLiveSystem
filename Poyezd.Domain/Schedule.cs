namespace Poyezd.Domain;

public class Trip
{
    public DateTime Departure { get; set; }
    public DateTime Arrival { get; set; }
    public string BusId { get; set; } = string.Empty;
    public string RouteName { get; set; } = string.Empty;
}

public class Schedule
{
    public DateTime StartTime { get; set; }
    public List<Trip> Trips { get; set; } = new();
}
