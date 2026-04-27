using Microsoft.AspNetCore.Mvc;
using Poyezd.Domain;
using Poyezd.Api.Services;

namespace Poyezd.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SimulationController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpPost]
    public ActionResult<SimulationResponse> Simulate([FromBody] SimulationRequest request)
    {
        var result = _scheduleService.Simulate(request);
        return Ok(result);
    }
}
