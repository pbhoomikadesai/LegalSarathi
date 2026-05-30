import asyncio
from app.agents.orchestrator import Orchestrator

async def main():
    orc = Orchestrator()
    res = await orc.process_query("Police arrested neighbor without warrant for petty theft. What are the rights under BNS?", "en")
    print("\n--- FINAL RESULT ---")
    import json
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
