export function ensureAuthenticated(req, res, next) {

    console.log("isAuthenticated:", req.isAuthenticated());
    

    if (req.isAuthenticated()) {
        return next();
    }

    return res.status(401).json({
        error: "Unauthorized"
    });

}