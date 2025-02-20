﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using MIConvexHull;
using TVGL;

namespace Assembly_Planner
{
    public class FootprintFace
    {
        /// <summary>
        /// Gets the New Face's Unique Name
        /// </summary>
        /// <value>
        /// Name
        /// </value>
        public double Name { get; set; }
        /// <summary>
        /// Gets the merged faces 
        /// </summary>
        /// <value>
        /// Faces
        /// </value>
        public List<PolygonalFace> Faces { get; set; }
        /// <summary>
        /// Gets the New Face's Normal
        /// </summary>
        /// <value>
        /// Normal
        /// </value>
        public double[] Normal { get; set; }
        /// <summary>
        /// Gets the Center Of Mass Projection.
        /// </summary>
        /// <value>
        /// Center Of Mass Projection
        /// </value>
        public Vertex COMP { get; set; }
        /// <summary>
        /// Gets the Outer Edges
        /// </summary>
        /// <value>
        /// Outer Edges
        /// </value>
        public Edge[] OuterEdges { get; set; }
        //public List<double> DistanceBetweenCOMProjAndEachnode = new List<double>();
        /// <summary>
        /// Gets the minimum distance of COMProjection to its Nearest Edge.
        /// </summary>
        /// <value>
        /// minimum distance of COMProjection to its Nearest Edge
        /// </value>
        public double MinDisNeaEdg { get; set; }
        /// <summary>
        /// Gets the hight of center of mass of the CVXhull based upon the footprint face
        /// </summary>
        /// <value>
        /// Hight of Center of Mass
        /// </value>
        public double Height { get; set; }
        /// <summary>
        /// Gets the adjacent faces of the new face
        /// </summary>
        /// <value>
        /// Adjacent Faces
        /// </value>
        public List<FootprintFace> Adjacents { get; set; }
        /// <summary>
        /// Gets the IsComInsideFace
        /// </summary>
        /// <value>
        /// IsComInsideFace
        /// </value>
        public bool IsComInsideFace { get; set; }
        /// <summary>
        /// Gets the Insertion Convinience Score.
        /// </summary>
        /// <value>
        /// Insertion Convinience Score
        /// </value>
        public double IC { get; set; }
        /// <summary>
        /// Gets the rotation cost score.
        /// </summary>
        /// <value>
        /// Rotation Cost
        /// </value>
        public double RC { get; set; }
        /// <summary>
        /// Gets the reference stability score
        /// </summary>
        /// <value>
        /// Reference Stability Score
        /// </value>
        public double RefS { get; set; }
        /// <summary>
        /// Gets the combined stability score
        /// </summary>
        /// <value>
        /// Combined Stability Score
        /// </value>
        public double ComS { get; set; }
        /// <summary>
        /// Gets the total cost obtained from Insertion Convenience, Rotation and Stability
        /// </summary>
        /// <value>
        /// total cost
        /// </value>
        public double TotalCost { get; set; }

        public FootprintFace()
        {

        }
        public FootprintFace(double[] normal)
        {
            Normal = normal;
        }
    }
}
