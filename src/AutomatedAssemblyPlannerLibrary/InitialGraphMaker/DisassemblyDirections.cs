﻿using System;
using System.CodeDom;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GraphSynth.Representation;
using StarMathLib;
using TVGL;
using TVGL;
using Assembly_Planner.GraphSynth.BaseClasses;

namespace Assembly_Planner
{
    public class DisassemblyDirections
    {
        public static List<double[]> Directions = new List<double[]>();
        public static Dictionary<int, int> DirectionsAndOpposits = new Dictionary<int, int>();
        public static Dictionary<int, int> DirectionsAndOppositsForGlobalpool = new Dictionary<int, int>();
        public static Dictionary<int, HashSet<int>> DirectionsAndSame;
        internal static List<TessellatedSolid> Solids;
        internal static Dictionary<int, List<Component[]>> NonAdjacentBlocking = new Dictionary<int, List<Component[]>>(); //Component[0] is blocked by Component[1]
        internal static List<int> Run(designGraph assemblyGraph, List<TessellatedSolid> solids)
        {
            Solids = new List<TessellatedSolid>(solids);
            Directions = IcosahedronPro.DirectionGeneration();
            var globalDirPool = new List<int>();
            var solidPrimitive = BlockingDetermination.PrimitiveMaker(solids);

            //var gears = BoltAndGearDetection.GearDetector(solidPrimitive);

            AddingNodesToGraph(assemblyGraph, solids);//, gears, screwsAndBolts);

            /*for (var i = 0; i < solids.Count - 1; i++)
            {
                var solid1 = solids[i];
                var solid1Primitives = solidPrimitive[solid1];
                for (var j = i + 1; j < solids.Count; j++)
                {
                    var solid2 = solids[j];
                    var solid2Primitives = solidPrimitive[solid2];
                    List<int> localDirInd;
                    double cert;
                    if (BlockingDetermination.DefineBlocking(assemblyGraph, solid1, solid2, solid1Primitives, solid2Primitives,
                        globalDirPool, out localDirInd, out cert))
                    {
                        // I wrote the code in a way that "solid1" is always "Reference" and "solid2" is always "Moving".
                        //List<int> finDirs, infDirs;
                        //UnconnectedBlockingDetermination.FiniteDirectionsBetweenConnectedParts(solid1, solid2, localDirInd, out finDirs, out infDirs);
                        var from = assemblyGraph[solid2.Name]; // Moving
                        var to = assemblyGraph[solid1.Name];   // Reference
                        assemblyGraph.addArc((Component)from, (Component)to);
                        var a = (Connection)assemblyGraph.arcs.Last();
                        a.Certainty = cert;
                        AddInformationToArc(a, localDirInd);
                    }
                }
            }*/
            return globalDirPool;
        }

        private static void AddInformationToArc(Connection a, IEnumerable<int> localDirInd)
        {
            a.localVariables.Add(DisConstants.DirIndLowerBound);
            foreach (var dir in localDirInd)
            {
                a.localVariables.Add(dir);
            }
            a.localVariables.Add(DisConstants.DirIndUpperBound);
        }

        private static void AddingNodesToGraph(designGraph assemblyGraph, List<TessellatedSolid> solids)//,
                                                                                                        //Dictionary<TessellatedSolid, double[]> gears)
        {
            foreach (var solid in solids)
            {
                var Component = assemblyGraph.addNode(solid.Name);
                //if (gears.Keys.Contains(solid))
                //{
                //    Component.localLabels.Add(DisConstants.Gear);
                //    Component.localVariables.Add(DisConstants.GearNormal);
                //    Component.localVariables.AddRange(gears[solid]);
                //}
            }
        }

        private static List<double[]> FreeDirectionFinder(Component Component)
        {
            var dirsG = new List<List<double[]>>();
            foreach (Connection arc in Component.arcs.Where(a => a is Connection))
            {
                var iniDirs = new List<double[]>();
                var indexL0 = arc.localVariables.IndexOf(DisConstants.DirIndLowerBound);
                var indexU0 = arc.localVariables.IndexOf(DisConstants.DirIndUpperBound);
                if (Component == arc.From)
                    for (var i = indexL0 + 1; i < indexU0; i++)
                        iniDirs.Add(Directions[(int)arc.localVariables[i]]);
                else
                    for (var i = indexL0 + 1; i < indexU0; i++)
                        iniDirs.Add((Directions[(int)arc.localVariables[i]]).multiply(-1));
                dirsG.Add(iniDirs);
            }
            return dirsG[0].Where(dir => dirsG.All(dirs => dirs.Any(d => Math.Abs(1 - d.dotProduct(dir)) < OverlappingFuzzification.CheckWithGlobDirsParall))).ToList();
        }

    }
}
