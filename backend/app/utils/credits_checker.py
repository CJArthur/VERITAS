from fastapi import HTTPException, status, Depends

from app.utils.dependencies import get_current_user
from app.db.models import User

class CreditChecker:
    def __init__(self, cost: int = 1):
        self.cost = cost

    # Automatic call then use Depends
    async def __call__(self, current_user: User = Depends(get_current_user)):
        # In future can use data from db
        user_credits = 100

        if user_credits < self.cost:
            raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED,
                                detail="Need credits")
        
        return True
    

# Create presets for tsks
check_generation_credits = CreditChecker(cost=10) # generation price
check_basic_credits = CreditChecker(cost=1) # Basic Action

# You can use this in proxy for check credits before request