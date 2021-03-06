"use strict";

var Class = require("abitbol");
var BinaryHeap = require("./BinaryHeap.js");

var Astar = Class.$extend({
	currentObstacleFlag: null,

	init: function init(graph) {
		for (var x = 0; x < graph.length; x++) {
			//for(var x in graph) {
			var node = graph[x];
			node.f = 0;
			node.g = 0;
			node.h = 0;
			node.cost = 1.0;
			node.visited = false;
			node.closed = false;
			node.parent = null;
		}
	},

	cleanUp: function cleanUp(graph) {
		for (var x = 0; x < graph.length; x++) {
			var node = graph[x];
			delete node.f;
			delete node.g;
			delete node.h;
			delete node.cost;
			delete node.visited;
			delete node.closed;
			delete node.parent;
		}
	},

	heap: function heap() {
		return new BinaryHeap(function (node) {
			return node.f;
		});
	},

	search: function search(graph, start, end, obstacleFlag, nodeChannelCollector) {
		this.init(graph);
		this.currentObstacleFlag = obstacleFlag;
		//heuristic = heuristic || astar.manhattan;
		//may check start and end items here if obsFlag is not null...

		var openHeap = this.heap();

		openHeap.push(start);

		while (openHeap.size() > 0) {

			// Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
			var currentNode = openHeap.pop();

			// End case -- result has been found, return the traced path.
			if (currentNode === end) {
				var curr = currentNode;
				var ret = typeof nodeChannelCollector === 'undefined' || nodeChannelCollector === null ? [] : nodeChannelCollector;

				while (curr.parent) {
					ret.push(curr);
					curr = curr.parent;
				}
				this.cleanUp(ret);
				return ret.reverse();
			}

			// Normal case -- move currentNode from open to closed, process each of its neighbours.
			currentNode.closed = true;

			// Find all neighbours for the current node. Optionally find diagonal neighbours as well (false by default).
			var neighbours = this.neighbours(graph, currentNode);

			for (var i = 0, il = neighbours.length; i < il; i++) {
				var neighbour = neighbours[i];

				if (neighbour.closed) {
					// Not a valid node to process, skip to next neighbour.
					continue;
				}

				// The g score is the shortest distance from start to current node.
				// We need to check if the path we have arrived at this neighbour is the shortest one we have seen yet.
				var gScore = currentNode.g + neighbour.cost;
				var beenVisited = neighbour.visited;

				if (!beenVisited || gScore < neighbour.g) {

					// Found an optimal (so far) path to this node.  Take score for node to see how good it is.
					neighbour.visited = true;
					neighbour.parent = currentNode;
					if (!neighbour.centroid || !end.centroid) debugger;
					neighbour.h = neighbour.h || this.heuristic(neighbour.centroid, end.centroid);
					neighbour.g = gScore;
					neighbour.f = neighbour.g + neighbour.h;

					if (!beenVisited) {
						// Pushing to heap will put it in proper place based on the 'f' value.
						openHeap.push(neighbour);
					} else {
						// Already seen the node, but since it has been rescored we need to reorder it in the heap
						openHeap.rescoreElement(neighbour);
					}
				}
			}
		}

		// No result was found - empty array signifies failure to find path.
		// null should be more appropriate imho :)
		return [];
	},
	heuristic: function heuristic(pos1, pos2) {
		return BABYLON.Vector3.DistanceSquared(pos1, pos2);
	},
	neighbours: function neighbours(graph, node) {
		var ret = [];

		for (var e = 0; e < node.neighbours.length; e++) {
			var neighbour = graph[node.neighbours[e]];
			if (this.currentObstacleFlag === null || (neighbour.obstacleMask & this.currentObstacleFlag) === 0) {
				ret.push(neighbour);
			}
		}

		return ret;
	}

});

module.exports = Astar;