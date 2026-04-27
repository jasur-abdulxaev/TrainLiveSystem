namespace Poyezd.Domain;

public class Stop
{
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public bool IsZeroTrip { get; set; } // Identifies if it's S12-S15
}
