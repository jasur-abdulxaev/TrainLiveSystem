namespace Poyezd.Domain;

public class SimulationRequest
{
    public Route Route { get; set; } = new();
    public List<PassengerFlow> Flows { get; set; } = new();
    public BusParameters Bus { get; set; } = new();
    public double TimeScale { get; set; } = 1.0;
}

public class BusParameters
{
    public int Capacity { get; set; } = 71;
    public double Gamma { get; set; } = 0.8;
    public double SpeedKmH { get; set; } = 25.0;
    public int StopTimeSeconds { get; set; } = 30;
    public double Length { get; set; } = 12.5;
    public double OuterRadius { get; set; } = 12.5;
    public double InnerRadius { get; set; } = 5.3;
}

public class SimulationResponse
{
    public List<HourlyBusCount> HourlyBusCounts { get; set; } = new();
    public Schedule Schedule { get; set; } = new();
    
    // Advanced Analytics
    public AnalyticsSummary Analytics { get; set; } = new();
}

public class AnalyticsSummary
{
    public double TotalMileageKm { get; set; }
    public int TotalPassengers { get; set; }
    public int MaxRequiredBuses { get; set; }
    public string PeakHour { get; set; } = string.Empty;
    public double AvgEfficiency { get; set; }
    public int TotalTripsGenerated { get; set; }
    public double SystemReliability { get; set; } = 98.5; // Estimated
}

public class HourlyBusCount
{
    public string TimePeriod { get; set; } = string.Empty;
    public int RequiredBuses { get; set; }
    public int PassengerCount { get; set; }
}
