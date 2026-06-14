export const SAMPLE_CODE = `#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <algorithm>
#include <cmath>
#include <map>

const int MAX_RETRIES = 3;

class AuditStamp {
public:
    void stamp() { std::cout << "Audit complete" << std::endl; }
};

class UserDashboardManager {
private:
    int userId;
    std::string token;
    std::string theme;
    std::string locale;
    bool debugMode;
    std::string callbackUrl;
    std::vector<double> scoreHistory;
    std::map<std::string, std::string> metadata;
    double cachedAverage;

public:
    UserDashboardManager(int id, const std::string& tok, const std::string& th,
                         const std::string& loc, bool dbg, const std::string& cb)
        : userId(id), token(tok), theme(th), locale(loc),
          debugMode(dbg), callbackUrl(cb), cachedAverage(0.0) {}

    void fetchUserProfile() {
        std::cout << "Fetching profile for user " << userId << std::endl;
    }

    void fetchUserScores() {
        std::cout << "Loading historical scores..." << std::endl;
    }

    void renderNavigation() {
        std::cout << "Navigation theme: " << theme << std::endl;
    }

    void renderUserPanel() {
        std::cout << "User panel locale: " << locale << std::endl;
    }

    void renderScoreChart() {
        for (double score : scoreHistory) { std::cout << score << " "; }
        std::cout << std::endl;
    }

    void validateSessionToken() {
        if (token.empty()) { std::cout << "Invalid session token" << std::endl; }
    }

    void writeAuditLog(const std::string& event) { metadata[event] = "logged"; }

    std::string classifyScore(double score) {
        if (score > 75) return "High";
        if (score > 50) return "Medium";
        return "Low";
    }

    void syncAllWidgets() {
        fetchUserProfile();
        fetchUserScores();
        renderNavigation();
        renderUserPanel();
        renderScoreChart();
        validateSessionToken();
    }
};

void legacyHelperFunction() {
    std::cout << "Legacy helper — never invoked" << std::endl;
}

int validateRange(double value) {
    if (value > 75) return 1;
    return 0;
}

int checkMinimum(double value) {
    if (value > 75) return 1;
    return 0;
}

int main() {
    std::string unusedFeature = "deprecated analytics module";

    UserDashboardManager dashboard(
        42, "token-abc", "dark", "en-US", true, "http://localhost/api");

    double primaryScore = 82.5;
    double secondaryScore = 61.0;

    if (primaryScore > 75) {
        std::cout << "Primary tier: high performance" << std::endl;
    }

    if (secondaryScore > 50) {
        std::cout << "Secondary tier: medium performance" << std::endl;
    }

    validateRange(primaryScore);
    checkMinimum(secondaryScore);
    dashboard.syncAllWidgets();
    return 0;
}
`

export const SAMPLE_FILENAME = 'USER_DASHBOARD.CPP'
