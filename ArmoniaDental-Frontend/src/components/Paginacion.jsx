const Pagination = ({
	paginaActual,
	totalPaginas,
	onCambioPagina,
	totalItems,
	itemsPorPagina,
}) => {
	const obtenerNumerosPagina = () => {
		const numeros = [];
		const maxBotones = 5;

		let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
		let fin = Math.min(totalPaginas, inicio + maxBotones - 1);

		if (fin - inicio < maxBotones - 1) {
			inicio = Math.max(1, fin - maxBotones + 1);
		}

		for (let i = inicio; i <= fin; i++) {
			numeros.push(i);
		}

		return numeros;
	};

	const indiceInicio = (paginaActual - 1) * itemsPorPagina + 1;
	const indiceFin = Math.min(paginaActual * itemsPorPagina, totalItems);

	if (totalPaginas <= 1) return null;

	return (
		<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
			<div className="flex items-center gap-2">
				<div className="join">
					{obtenerNumerosPagina().map((numero) => (
						<button
							key={numero}
							className={`join-item btn btn-outline btn-sm ${
								paginaActual === numero ? "btn-active" : ""
							}`}
							onClick={() => onCambioPagina(numero)}
						>
							{numero}
						</button>
					))}
				</div>
			</div>

			<span className="text-sm text-neutral">
				Mostrando {indiceInicio} - {indiceFin} de {totalItems}
			</span>
		</div>
	);
};

export default Pagination;
