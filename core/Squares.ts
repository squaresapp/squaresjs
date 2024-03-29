
namespace SquaresJS
{
	/**
	 * 
	 */
	export interface IGridOptions
	{
		/**
		 * Specifies the path to display in the address bar when the
		 * grid has the focus (as opposed to a page).
		 */
		readonly gridPath?: string;
		
		/**
		 * Defines the ratio of the height of the poster to its width.
		 * Defaults to a value of 1 (square).
		 */
		readonly posterHeightRatio?: number;
		
		/**
		 * Specifies the total number of posters available
		 * in the supplied stream. This is used to inform the
		 * rendered when to cut off fetching new posters.
		 */
		readonly maxPosterCount?: number;
		
		/**
		 * 
		 */
		readonly anchorPosterIndex?: number;
		
		/**
		 * Specifies the element that displays before all the other squares in the grid.
		 */
		readonly headerElement?: HTMLElement;
		
		/**
		 * Stores the element where the viewport is rendered.
		 */
		readonly viewportElement?: HTMLElement;
		
		/**
		 * Used to supply the UI that displays in place of a poster
		 * if there is a delay between the time that requestPoster()
		 * is called, and a poster element is returned.
		 */
		requestPlaceholder(): HTMLElement;
		
		/**
		 * 
		 */
		requestPoster(position: number): Promise<HTMLElement> | HTMLElement | null;
		
		/**
		 * Used to supply the sections that make up a page
		 * that gets clicked on in the grid.
		 */
		requestPage(
			selectedElement: HTMLElement,
			selectedIndex: number): {
				sections: HTMLElement[];
				path: string;
			}
	}
	
	/** */
	export class Squares
	{
		readonly head: HTMLElement;
		readonly grid;
		
		/** */
		constructor(private readonly options: IGridOptions)
		{
			const gridPath = options.gridPath || "/";
			
			this.head = raw.div(
				"squares-js-squares",
				{
					width: "-webkit-fill-available",
					height: "100%",
					backgroundColor: "transparent",
				},
				this.grid = new Grid(options),
				raw.on("connected", () =>
				{
					// This should only be called when starting at the grid.
					// If we're starting at a page, we need to replace state
					// with the page index
					History.push(IHistoryMarker.gridIndex, gridPath);
				}),
				raw.on("squares:enter", ev =>
				{
					const e = ev.detail.selectedElement;
					const index = getIndex(e);
					const { sections, path } = this.options.requestPage(e, index);
					
					this._page = new Retractable({
						underLayer: this.grid.head,
						contentElements: sections,
					});
					
					if (options.viewportElement)
						options.viewportElement.append(this._page.head);
					else
						this.grid.head.after(this._page.head);
					
					History.push(index, path);
				}),
				raw.on("squares:exit", ev =>
				{
					if (ev.target === this._page?.head)
						History.push(IHistoryMarker.gridIndex, gridPath);
				}),
				raw.on(window, "popstate", ev =>
				{
					if (!IHistoryMarker.is(ev.state))
						return;
					
					if (ev.state.index === IHistoryMarker.gridIndex)
						return this._page?.retract();
				})
			);
		}
		
		/**
		 * Gets the current page being displayed in the Squares widget,
		 * or null in the case when the grid is being displayed instead 
		 * of a page.
		 */
		get page()
		{
			return this._page;
		}
		private _page: Retractable | null = null;
	}
}
