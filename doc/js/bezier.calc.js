define([], function() {

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    function BezierCurve(p0, p1, p2, p3) {
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    function Segment(a, b) {
        this.a = a;
        this.b = b;
    }

    function pointOnSegmentAtInterval(segment, interval) {
        var dy, dx, newX, newY, newPoint;

        dx = segment.b.x - segment.a.x;
        dy = segment.b.y - segment.a.y;

        newX = dx * interval + segment.a.x;
        newY = dy * interval + segment.a.y;

        newPoint = new Point(newX, newY);

        return newPoint;
    }

    function splitBezierCurve(bezierCurve, t) {
        var bc, bc1, bc2, q0, q1, q2, r0, r1, b;

        bc = bezierCurve;

        q0 = pointOnSegmentAtInterval(new Segment(bc.p0, bc.p1), t);
        q1 = pointOnSegmentAtInterval(new Segment(bc.p1, bc.p2), t);
        q2 = pointOnSegmentAtInterval(new Segment(bc.p2, bc.p3), t);

        r0 = pointOnSegmentAtInterval(new Segment(q0, q1), t);
        r1 = pointOnSegmentAtInterval(new Segment(q1, q2), t);

        b = pointOnSegmentAtInterval(new Segment(r0, r1), t);

        bc1 = new BezierCurve(bc.p0, q0, r0, b);
        bc2 = new BezierCurve(b, r1, q2, bc.p3);

        return [bc1, bc2]
    }

    function normalizeBezierCurve(bezierCurve) {
        var bc, minX, minY, scaleX, scaleY, p0, p1, p2, p3;

        bc = bezierCurve;

        minX = bc.p0.x;
        minY = bc.p0.y;
        scaleX = bc.p3.x - minX;
        scaleY = bc.p3.y - minY;

        p0 = new Point(0, 0);
        p1 = new Point(parseInt((bc.p1.x - minX) / scaleX * 1000) / 1000, parseInt((bc.p1.y - minY) / scaleY * 1000) / 1000);
        p2 = new Point(parseInt((bc.p2.x - minX) / scaleX * 1000) / 1000, parseInt((bc.p2.y - minY) / scaleY * 1000) / 1000);
        p3 = new Point(1, 1);

        return new BezierCurve(p0, p1, p2, p3);
    }

    function drawBezier(bezierCurve, color) {
        var canvas = document.getElementById("myCanvas"),
            ctx = canvas.getContext("2d"),
            bc = bezierCurve,
            height = 200;

        ctx.beginPath();
        ctx.moveTo(bc.p0.x * 100, height - bc.p0.y * 100);
        ctx.lineWidth=5;
        ctx.bezierCurveTo(bc.p1.x * 100, height - bc.p1.y * 100, bc.p2.x * 100, height - bc.p2.y * 100, bc.p3.x * 100, height - bc.p3.y * 100);
        ctx.strokeStyle=color || "black";
        ctx.stroke();
    }

    return {
        Point: Point,
        BezierCurve: BezierCurve,
        splitBezierCurve: splitBezierCurve,
        normalizeBezierCurve: normalizeBezierCurve
    };

});
