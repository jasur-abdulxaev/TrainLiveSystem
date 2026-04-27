namespace Poyezd.Domain;

public class Trip
{
    public DateTime Departure { get; set; }
    public DateTime Arrival { get; set; }
}

public class Schedule
{
    public DateTime StartTime { get; set; }
    public List<Trip> Trips { get; set; } = new();
}
