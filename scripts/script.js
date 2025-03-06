const backendURL = "https://betting-game-zeta.vercel.app";
let bettingOpen = false;
let selectedBox = null;
let betAmount = 0;
let hasBetThisRound = false; // Track if user has already placed a bet

// Persistent user ID
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = "user_" + Math.floor(Math.random() * 100000);
    localStorage.setItem("userId", userId);
}

const placeBetButton = document.getElementById("placeBet");

async function fetchStartTime() {
    try {
        const response = await fetch(`${backendURL}/start-time`);
        const data = await response.json();
        startCountdown(data.startTime);
    } catch (error) {
        console.error("Error fetching start time:", error);
    }
}

async function fetchBalance() {
    try {
        const response = await fetch(`${backendURL}/balance/${userId}`);
        const data = await response.json();
        document.getElementById("balance").textContent = `Balance: KES ${data.balance}`;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

function startCountdown(startTime) {
    function updateTimer() {
        let currentTime = Math.floor(Date.now() / 1000);
        let timeLeft = startTime - currentTime;

        if (timeLeft <= 0) {
            document.getElementById("timer").textContent = "Betting closed!";
            bettingOpen = false;
            disableBoxes();
            placeBetButton.disabled = true; // Disable bet button
            fetchResults();
        } else {
            document.getElementById("timer").textContent = `Time Left: ${timeLeft}s`;

            if (!hasBetThisRound) {
                bettingOpen = true;
                enableBoxes();
                placeBetButton.disabled = false; // Enable only if the user hasn't bet
            }

            setTimeout(updateTimer, 1000);
        }
    }

    updateTimer();
}

// Select a box
document.querySelectorAll(".box").forEach(box => {
    box.addEventListener("click", function() {
        if (!bettingOpen) {
            alert("Betting is closed!");
            return;
        }

        selectedBox = this.getAttribute("data-box");
        document.querySelectorAll(".box").forEach(b => b.classList.remove("selected"));
        this.classList.add("selected");

        document.getElementById("message").textContent = `Selected Box ${selectedBox}`;
    });
});

// Confirm bet
placeBetButton.addEventListener("click", function() {
    if (!bettingOpen) {
        alert("Betting is closed! Wait for the next round.");
        return;
    }

    if (hasBetThisRound) {
        alert("You have already placed a bet this round!");
        return;
    }

    betAmount = parseInt(document.getElementById("betAmount").value);
    if (!betAmount || betAmount <= 0 || !selectedBox) {
        alert("Select a box and enter a valid amount!");
        return;
    }

    // Mark that the user has placed a bet
    hasBetThisRound = true;
    placeBetButton.disabled = true; // Disable the button after betting

    fetch(`${backendURL}/place-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, boxNumber: selectedBox, amount: betAmount }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(`Error: ${data.error}`);
            placeBetButton.disabled = false; // Re-enable if there's an error
            hasBetThisRound = false; // Allow retry
        } else {
            document.getElementById("message").textContent = `✅ Bet placed: KES ${betAmount} on Box ${selectedBox}`;
            document.getElementById("balance").textContent = `Balance: KES ${data.balance}`;
        }
    })
    .catch(error => {
        console.error("Error placing bet:", error);
        placeBetButton.disabled = false; // Re-enable if there's a network error
        hasBetThisRound = false; // Allow retry
    });
});

// Fetch results
async function fetchResults() {
    try {
        const response = await fetch(`${backendURL}/bet-results`);
        const data = await response.json();
        const winningBox = data.winningBox;

        if (selectedBox == winningBox) {
            document.getElementById("message").textContent = `🎉 You won! Winning box: ${winningBox}`;
        } else {
            document.getElementById("message").textContent = `😢 You lost! Winning box was ${winningBox}`;
        }

        fetchBalance();
        selectedBox = null;
        betAmount = 0;
        hasBetThisRound = false; // Reset for the next round
        setTimeout(fetchStartTime, 5000);
    } catch (error) {
        console.error("Error fetching results:", error);
    }
}

function disableBoxes() {
    document.querySelectorAll(".box").forEach(box => {
        box.style.opacity = "0.5";
        box.style.pointerEvents = "none";
    });
}

function enableBoxes() {
    document.querySelectorAll(".box").forEach(box => {
        box.style.opacity = "1";
        box.style.pointerEvents = "auto";
    });
}

// Initialize game
fetchStartTime();
fetchBalance();