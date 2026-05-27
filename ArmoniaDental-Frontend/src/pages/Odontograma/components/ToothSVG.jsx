import { STATUS_COLORS } from "../data/odontogramaConstants";
import { getType, getWholeAction } from "../utils/odontogramaHelpers";

export default function ToothSVG({
	num,
	upper,
	tooth,
	onContextMenu,
	onClick,
	small,
}) {
	const type = getType(num);
	const w = small ? 34 : 44;
	const h = small ? 72 : 90;
	const marks = tooth.marks || [];

	const ausente = getWholeAction(marks, ["ausente"]);
	const implante = getWholeAction(marks, ["implante"]);
	const endodoncia = getWholeAction(marks, ["endodoncia"]);
	const restoRadicular = getWholeAction(marks, ["resto_radicular"]);
	const exodoncia = getWholeAction(marks, ["indicada_exodoncia"]);
	const brackets = getWholeAction(marks, ["brackets"]);
	const sellante = getWholeAction(marks, ["sellante"]);

	const corona =
		getWholeAction(marks, [
			"corona_metal_porcelana",
			"corona_libre_metal",
			"corona_acero_cromado",
		]) || null;

	const fractureMarks = marks.filter((m) => m.actionId === "fractura_coronal");
	const gTransform = upper ? "scale(1)" : "translate(0,80) scale(1,-1)";

	const shapes = {
		molar3: {
			crown:
				"M7,40 Q6,22 9,16 L13,11 Q16,7 20,7 Q24,7 27,11 L31,16 Q34,22 33,40 Z",
			roots: [
				"M10,40 Q8,54 7,66 Q9,71 12,67 Q13,57 14,40",
				"M20,40 Q20,56 20,68 Q22,72 24,68 Q24,56 26,40",
				"M30,40 Q31,54 33,66 Q35,71 32,67 Q29,57 26,40",
			],
		},
		molar: {
			crown:
				"M8,40 Q7,24 10,18 L14,13 Q17,9 20,9 Q23,9 26,13 L30,18 Q33,24 32,40 Z",
			roots: [
				"M12,40 Q10,54 9,65 Q12,70 15,65 Q15,55 16,40",
				"M24,40 Q25,55 25,65 Q28,70 31,65 Q30,54 28,40",
			],
		},
		premolar: {
			crown:
				"M9,40 Q8,27 11,20 L15,14 Q17,10 20,10 Q23,10 25,14 L29,20 Q32,27 31,40 Z",
			roots: [
				"M14,40 Q13,54 12,66 Q15,71 18,66 Q18,55 18,40",
				"M22,40 Q22,55 22,66 Q25,71 28,66 Q27,54 26,40",
			],
		},
		canino: {
			crown:
				"M10,40 Q9,29 12,21 L16,13 Q18,8 20,8 Q22,8 24,13 L28,21 Q31,29 30,40 Z",
			roots: [
				"M18,40 Q17,55 16,68 Q18,74 20,74 Q22,74 24,68 Q23,55 22,40",
			],
		},
		incisivo: {
			crown:
				"M11,40 Q10,31 13,23 L17,16 Q18,12 20,12 Q22,12 23,16 L27,23 Q30,31 29,40 Z",
			roots: [
				"M18,40 Q17,53 16,65 Q18,71 20,71 Q22,71 24,65 Q23,53 22,40",
			],
		},
	};

	const sh = shapes[type] || shapes.incisivo;
	const mainStroke = corona?.color || "#9ca3af";
	const mainFill = corona ? "#eff6ff" : "#f3f4f6";

	return (
		<svg
			width={w}
			height={h}
			viewBox="0 0 40 80"
			onContextMenu={(e) => onContextMenu(e, num)}
            onClick={(e) => {
                e.stopPropagation();
                onClick(e, num);
            }}
			className="cursor-pointer block select-none"
			style={{ overflow: "visible" }}
		>
			<g transform={gTransform}>
				{!ausente &&
					!implante &&
					(sh.roots || []).map((d, i) => (
						<path
							key={i}
							d={d}
							fill="none"
							stroke={
								endodoncia?.color ||
								restoRadicular?.color ||
								mainStroke
							}
							strokeWidth={endodoncia || restoRadicular ? 2.3 : 1.2}
							strokeLinecap="round"
						/>
					))}

				{implante && (
					<>
						<rect
							x="16"
							y="42"
							width="8"
							height="24"
							rx="2"
							fill="none"
							stroke={implante.color}
							strokeWidth="1.8"
						/>
						{[48, 54, 60].map((y) => (
							<line
								key={y}
								x1="16"
								y1={y}
								x2="24"
								y2={y}
								stroke={implante.color}
								strokeWidth="1"
							/>
						))}
					</>
				)}

				{!ausente && (
					<path
						d={sh.crown}
						fill={mainFill}
						stroke={mainStroke}
						strokeWidth={corona ? 2 : 1.2}
					/>
				)}

				{corona && (
					<rect
						x="10"
						y="19"
						width="20"
						height="16"
						fill="none"
						stroke={corona.color}
						strokeWidth="1.7"
						strokeDasharray="2 1"
					/>
				)}

				{sellante && !ausente && (
					<text
						x="20"
						y="24"
						textAnchor="middle"
						fontSize="10"
						fontWeight="bold"
						fill={sellante.color}
					>
						S
					</text>
				)}

				{ausente && (
					<>
						<line
							x1="10"
							y1="12"
							x2="30"
							y2="68"
							stroke={ausente.color}
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
						<line
							x1="30"
							y1="12"
							x2="10"
							y2="68"
							stroke={ausente.color}
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</>
				)}

				{exodoncia && (
					<line
						x1="8"
						y1="8"
						x2="31"
						y2="72"
						stroke={exodoncia.color}
						strokeWidth="2.2"
						strokeLinecap="round"
					/>
				)}

				{brackets && !ausente && (
					<>
						<rect
							x="13"
							y="27"
							width="14"
							height="8"
							rx="1.5"
							fill="none"
							stroke={brackets.color}
							strokeWidth="1.5"
						/>
						<line
							x1="20"
							y1="27"
							x2="20"
							y2="35"
							stroke={brackets.color}
							strokeWidth="1"
						/>
					</>
				)}

				{fractureMarks.length > 0 && (
					<path
						d="M13,18 L16,21 L14,24 L18,27 L16,31 L21,34"
						fill="none"
						stroke={STATUS_COLORS.rojo}
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				)}
			</g>
		</svg>
	);
}