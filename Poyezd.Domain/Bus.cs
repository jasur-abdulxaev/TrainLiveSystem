namespace Poyezd.Domain;

public class Bus
{
    public string Model { get; set; } = "Maz-303";
    public int NominalCapacity { get; set; } = 71;
    public double Length { get; set; } = 12.5; // meters
    public double OuterRadius { get; set; } = 12.5; // meters
    public double InnerRadius { get; set; } = 5.3; // meters
    public double MaxSpeed { get; set; } = 80; // km/h
    public double Acceleration { get; set; } = 1.2; // m/s^2
    public double Braking { get; set; } = 1.5; // m/s^2

    public BusRelease? CheckAndGenerateRelease(int currentPassengers)
    {
        if (currentPassengers > NominalCapacity)
        {
            return new BusRelease
            {
                BusModel = this.Model,
                ReleaseTime = DateTime.Now,
                Type = "Extra (Peak Hour)"
            };
        }
        return null;
    }
}

public class BusRelease
{
    public string BusModel { get; set; } = string.Empty;
    public DateTime ReleaseTime { get; set; }
    public string Type { get; set; } = string.Empty; // e.g. "One-shift with break" (razrivnoy)
}
