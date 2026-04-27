namespace Poyezd.Domain;

public class PassengerFlow
{
    public string TimePeriod { get; set; } = string.Empty; // e.g. "06:00-07:00"
    public int PassengersPerHour { get; set; }
}
