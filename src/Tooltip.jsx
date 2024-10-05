import React from "react";

const Tooltip = ({ text, position }) => (
	<div className="rwd-tooltip" style={{ top: position.y, left: position.x }}>
		{text}
	</div>
);

export default Tooltip;
